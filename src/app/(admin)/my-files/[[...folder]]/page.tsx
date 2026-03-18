import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import { requireAppUser } from "@/lib/auth";
import { fetchMyFiles } from "@/lib/graph";

export const dynamic = "force-dynamic";

type MyFilesPageProps = {
  params: Promise<{ folder?: string[] }>;
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

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes < 0) {
    return "N/A";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export default async function MyFilesPage({ params }: MyFilesPageProps) {
  await requireAppUser();
  const resolvedParams = await params;
  const folderId = resolvedParams.folder?.[0]
    ? decodeURIComponent(resolvedParams.folder[0])
    : undefined;
  const files = await fetchMyFiles(folderId).catch((error) => ({
    errorMessage:
      error instanceof Error ? error.message : "Failed to load OneDrive files",
  }));

  if ("errorMessage" in files) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
        {files.errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            My Files
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {files.currentFolderName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {files.currentFolderId && (
            <ProgressNavLink
              href={
                files.parentFolderId
                  ? `/my-files/${encodeURIComponent(files.parentFolderId)}`
                  : "/my-files"
              }
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back
            </ProgressNavLink>
          )}
          <ProgressNavLink
            href="/my-files"
            className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Root
          </ProgressNavLink>
        </div>
      </div>

      {files.items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          No files or folders found in this location.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {files.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="mb-3 inline-flex rounded-full border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {item.kind === "folder" ? "Folder" : "File"}
              </div>
              <h2 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                {item.name}
              </h2>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Modified: {formatDate(item.modifiedAt)}
              </p>
              {item.kind === "folder" ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Items: {item.childCount ?? 0}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Size: {formatSize(item.size)}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.kind === "folder" ? (
                  <ProgressNavLink
                    href={`/my-files/${encodeURIComponent(item.id)}`}
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Open Folder
                  </ProgressNavLink>
                ) : (
                  <ProgressNavLink
                    href={`/my-files/file/${encodeURIComponent(item.id)}`}
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    {item.isVideo ? "Play Video" : "Open File"}
                  </ProgressNavLink>
                )}
                {item.kind === "file" && item.webUrl && (
                  <a
                    href={item.webUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Open in OneDrive
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
