import Link from "next/link";
import { fetchTrainingRecordingDetails } from "@/lib/graph";
import {
  createClientFingerprintFromHeaders,
  createRecordingStreamSignature,
} from "@/lib/streamAccess";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

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

type RecordingPageProps = {
  params: Promise<{ trainingId: string; recordingId: string }>;
};

export default async function RecordingPage({ params }: RecordingPageProps) {
  const { trainingId, recordingId } = await params;
  const decodedTrainingId = decodeURIComponent(trainingId);
  const decodedRecordingId = decodeURIComponent(recordingId);
  const { userId, sessionId } = await auth();

  try {
    if (!userId || !sessionId) {
      throw new Error("Unauthorized");
    }
    const requestHeaders = await headers();

    const details = await fetchTrainingRecordingDetails(
      decodedTrainingId,
      decodedRecordingId,
    );
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const clientFingerprint = createClientFingerprintFromHeaders(requestHeaders);
    const streamSignature = createRecordingStreamSignature({
      userId,
      sessionId,
      clientFingerprint,
      trainingId: details.training.id,
      recordingId: details.recording.id,
      recordingSource: details.recording.source,
      recordingUrl: details.recording.recordingUrl ?? "",
      expiresAt,
    });
    const streamUrl = `/api/trainings/${encodeURIComponent(
      details.training.id,
    )}/recordings/${encodeURIComponent(
      details.recording.id,
    )}/stream?expires=${expiresAt}&fp=${encodeURIComponent(
      clientFingerprint,
    )}&src=${encodeURIComponent(details.recording.source)}&u=${encodeURIComponent(
      details.recording.recordingUrl ?? "",
    )}&sig=${encodeURIComponent(streamSignature)}`;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {details.recording.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {details.training.title} - {formatDate(details.recording.startDateTime)}
            </p>
          </div>
          <Link
            href={`/trainings/${encodeURIComponent(details.training.id)}`}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Back to Training
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          {details.recording.source === "teams_artifact" &&
          details.recording.recordingUrl ? (
            <video
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              playsInline
              preload="metadata"
              className="h-[520px] w-full rounded-xl border border-gray-200 bg-black dark:border-gray-800"
              src={streamUrl}
            />
          ) : (
            <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
              This recording host blocks in-app embedding (for example,
              `outlook.office365.com` can refuse iframe connections). For
              view-only access, open trainings that expose `teams_artifact`
              streams.
            </div>
          )}

          {!details.recording.recordingUrl && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recording URL not available for this session.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {details.recording.eventUrl && (
              <a
                href={details.recording.eventUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                View Event
              </a>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Users in Meeting
          </h2>
          {details.participants.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No participant info available from Graph.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
        {error instanceof Error ? error.message : "Failed to load recording"}
      </div>
    );
  }
}
