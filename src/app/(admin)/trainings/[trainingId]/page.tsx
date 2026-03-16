import { fetchTrainingDetails } from "@/lib/graph";
import TrainingCardActions from "@/components/trainings/TrainingCardActions";
import ProgressNavLink from "@/components/trainings/ProgressNavLink";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) {
    return "N/A";
  }
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

type TrainingDetailPageProps = {
  params: Promise<{ trainingId: string }>;
};

export default async function TrainingDetailPage({
  params,
}: TrainingDetailPageProps) {
  const { trainingId } = await params;
  const decodedTrainingId = decodeURIComponent(trainingId);

  try {
    const details = await fetchTrainingDetails(decodedTrainingId);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {details.training.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Training details, past recordings, and meeting participants.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <TrainingCardActions trainingId={details.training.id} />
            <ProgressNavLink
              href="/trainings"
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back to Trainings
            </ProgressNavLink>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-2">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Past Recordings
            </h2>
            {details.recordings.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No past sessions found for this training.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {details.recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {recording.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(recording.startDateTime)} -{" "}
                        {formatDate(recording.endDateTime)}
                      </p>
                    </div>
                    <ProgressNavLink
                      href={`/trainings/${encodeURIComponent(
                        details.training.id,
                      )}/recordings/${encodeURIComponent(recording.id)}`}
                      className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Open Recording
                    </ProgressNavLink>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Meeting Users
            </h2>
            {details.participants.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No participant info available from Graph.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {details.participants.map((participant, index) => (
                  <div
                    key={`${participant.email ?? participant.name ?? "user"}-${index}`}
                    className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {participant.name ?? "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {participant.email ?? "No email"} - {participant.role}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Duration: {formatDuration(participant.durationInSeconds)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/30 dark:bg-warning-500/10">
          <h2 className="text-base font-semibold text-warning-800 dark:text-warning-200">
            Graph Diagnostics
          </h2>
          <div className="mt-3 space-y-1 text-sm text-warning-700 dark:text-warning-300">
            <p>
              Online meeting resolved:{" "}
              {details.diagnostics.onlineMeetingResolved ? "Yes" : "No"}
            </p>
            <p>
              Meeting owner context:{" "}
              {details.diagnostics.onlineMeetingOwnerUserId ?? "Unavailable"}
            </p>
            <p>Recording source: {details.diagnostics.recordingSource}</p>
            <p>Participant source: {details.diagnostics.participantSource}</p>
          </div>
          {details.diagnostics.warnings.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warning-700 dark:text-warning-300">
              {details.diagnostics.warnings.map((warning, idx) => (
                <li key={`${warning}-${idx}`}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
        {error instanceof Error ? error.message : "Failed to load training details"}
      </div>
    );
  }
}
