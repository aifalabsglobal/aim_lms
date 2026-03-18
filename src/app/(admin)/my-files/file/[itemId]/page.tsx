import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import { requireAppUser } from "@/lib/auth";
import { fetchMyFileById } from "@/lib/graph";

export const dynamic = "force-dynamic";

type MyFileViewPageProps = {
  params: Promise<{ itemId: string }>;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Unknown";
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
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default async function MyFileViewPage({ params }: MyFileViewPageProps) {
  const appUser = await requireAppUser();
  const { itemId } = await params;
  const decodedItemId = decodeURIComponent(itemId);
  const file = await fetchMyFileById(decodedItemId, {
    email: appUser.email ?? null,
    role: appUser.role ?? null,
  }).catch((error) => ({
    errorMessage: error instanceof Error ? error.message : "Failed to load file",
  }));

  if ("errorMessage" in file) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
        {file.errorMessage}
      </div>
    );
  }

  const streamUrl = `/api/my-files/${encodeURIComponent(file.id)}/stream`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {file.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Modified: {formatDate(file.modifiedAt)}
          </p>
        </div>
        <ProgressNavLink
          href="/my-files"
          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Back to My Files
        </ProgressNavLink>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        {file.isVideo ? (
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
            This file type is not playable in the in-app video player.
          </div>
        )}

      </div>
    </div>
  );
}
