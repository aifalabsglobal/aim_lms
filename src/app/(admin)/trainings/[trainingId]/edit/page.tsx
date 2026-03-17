import EditMeetingForm from "@/components/trainings/EditMeetingForm";
import { getCurrentAppUser } from "@/lib/auth";
import { fetchMeetingForEdit } from "@/lib/graph";
import Link from "next/link";

type PageProps = {
  params: Promise<{ trainingId: string }>;
};

export default async function EditTrainingMeetingPage({ params }: PageProps) {
  const appUser = await getCurrentAppUser();
  const role = appUser?.role?.toLowerCase() ?? null;
  const canEdit = role === "admin" || role === "super_admin";

  if (!canEdit) {
    return (
      <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
        <p className="font-medium">Access denied</p>
        <p className="mt-1">
          Only admins can edit meetings. Your current role is{" "}
          <span className="font-semibold">{role ?? "unknown"}</span>.
        </p>
      </div>
    );
  }

  const { trainingId } = await params;
  let error: string | null = null;
  let meeting:
    | {
        id: string;
        title: string;
        description: string;
        startDateTime: string;
        endDateTime: string;
        timeZone: string;
        attendeeEmails: string[];
      }
    | null = null;

  try {
    meeting = await fetchMeetingForEdit(trainingId);
  } catch (fetchError) {
    error = fetchError instanceof Error ? fetchError.message : "Failed to load meeting";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Edit Training Meeting
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Update Teams meeting details and notify attendees.
          </p>
        </div>
        <Link
          href="/trainings"
          className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to Trainings
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      {meeting && <EditMeetingForm meeting={meeting} />}
    </div>
  );
}
