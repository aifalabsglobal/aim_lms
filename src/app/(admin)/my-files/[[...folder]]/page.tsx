import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import { requireAppUser } from "@/lib/auth";
import { fetchMyFiles } from "@/lib/graph";

export const dynamic = "force-dynamic";

type MyFilesPageProps = {
  params: Promise<{ folder?: string[] }>;
  searchParams?: Promise<{ q?: string; view?: string }>;
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

export default async function MyFilesPage({ params, searchParams }: MyFilesPageProps) {
  const appUser = await requireAppUser();
  const role = appUser.role?.toLowerCase() ?? "";
  const isPrivileged = role === "admin" || role === "super_admin";
  const resolvedParams = await params;
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const folderId = resolvedParams.folder?.[0]
    ? decodeURIComponent(resolvedParams.folder[0])
    : undefined;
  const rawQuery = (resolvedSearchParams.q ?? "").trim();
  const normalizedQuery = rawQuery.toLowerCase();
  const viewMode = resolvedSearchParams.view === "list" ? "list" : "tiles";
  const files = await fetchMyFiles(folderId, {
    email: appUser.email ?? null,
    role: appUser.role ?? null,
  }).catch((error) => ({
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

  const getSortableTime = (value: string | null): number => {
    if (!value) {
      return Number.POSITIVE_INFINITY;
    }
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
  };

  const videoLabelById = new Map<string, string>();
  const orderedVideos = files.items
    .filter((item) => item.kind === "file" && item.isVideo)
    .slice()
    .sort((a, b) => {
      const timeDiff = getSortableTime(a.modifiedAt) - getSortableTime(b.modifiedAt);
      if (timeDiff !== 0) {
        return timeDiff;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  orderedVideos.forEach((item, index) => {
    videoLabelById.set(item.id, `Vid ${index + 1}`);
  });

  const visibleItems = normalizedQuery
    ? files.items.filter((item) => {
        const label = videoLabelById.get(item.id)?.toLowerCase() ?? "";
        return item.name.toLowerCase().includes(normalizedQuery) || label.includes(normalizedQuery);
      })
    : files.items;
  const videoOrderById = new Map<string, number>();
  orderedVideos.forEach((item, index) => {
    videoOrderById.set(item.id, index);
  });
  const sortedVisibleItems = visibleItems.slice().sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "folder" ? -1 : 1;
    }
    if (a.kind === "folder" && b.kind === "folder") {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    const aVideoIndex = videoOrderById.get(a.id);
    const bVideoIndex = videoOrderById.get(b.id);
    const aIsOrderedVideo = typeof aVideoIndex === "number";
    const bIsOrderedVideo = typeof bVideoIndex === "number";
    if (aIsOrderedVideo && bIsOrderedVideo) {
      return aVideoIndex - bVideoIndex;
    }
    if (aIsOrderedVideo !== bIsOrderedVideo) {
      return aIsOrderedVideo ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const currentPath = files.currentFolderId
    ? `/my-files/${encodeURIComponent(files.currentFolderId)}`
    : "/my-files";
  const withQuery = (path: string, opts?: { query?: string; view?: "tiles" | "list" }) => {
    const params = new URLSearchParams();
    if (opts?.query) {
      params.set("q", opts.query);
    }
    if (opts?.view) {
      params.set("view", opts.view);
    }
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

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
          <form method="get" className="mr-1">
            <input type="hidden" name="view" value={viewMode} />
            <input
              type="search"
              name="q"
              defaultValue={rawQuery}
              placeholder="Search files or videos"
              className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </form>
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <ProgressNavLink
              href={withQuery(currentPath, { query: rawQuery || undefined, view: "tiles" })}
              className={`px-3 py-2 text-xs font-medium ${
                viewMode === "tiles"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              Tiles
            </ProgressNavLink>
            <ProgressNavLink
              href={withQuery(currentPath, { query: rawQuery || undefined, view: "list" })}
              className={`px-3 py-2 text-xs font-medium ${
                viewMode === "list"
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              List
            </ProgressNavLink>
          </div>
          {files.currentFolderId && (
            <ProgressNavLink
              href={
                files.parentFolderId
                  ? withQuery(`/my-files/${encodeURIComponent(files.parentFolderId)}`, {
                      view: viewMode,
                    })
                  : withQuery("/my-files", { view: viewMode })
              }
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Back
            </ProgressNavLink>
          )}
          {isPrivileged && (
            <ProgressNavLink
              href={withQuery("/my-files", { view: viewMode })}
              className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Root
            </ProgressNavLink>
          )}
        </div>
      </div>

      {sortedVisibleItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          {rawQuery
            ? "No files or folders match your search."
            : "No files or folders found in this location."}
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-12 border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Modified</div>
            <div className="col-span-1">Size</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {sortedVisibleItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 items-center border-b border-gray-100 px-4 py-3 text-sm last:border-b-0 dark:border-gray-800/80"
            >
              <div className="col-span-5 min-w-0">
                <p className="truncate font-medium text-gray-800 dark:text-white/90">
                  {item.kind === "file" && item.isVideo
                    ? (videoLabelById.get(item.id) ?? item.name)
                    : item.name}
                </p>
                {item.kind === "file" && item.isVideo && (
                  <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    Original: {item.name}
                  </p>
                )}
              </div>
              <div className="col-span-2 text-gray-600 dark:text-gray-300">
                {item.kind === "folder" ? "Folder" : item.isVideo ? "Video" : "File"}
              </div>
              <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.modifiedAt)}
              </div>
              <div className="col-span-1 text-xs text-gray-500 dark:text-gray-400">
                {item.kind === "folder" ? `${item.childCount ?? 0}` : formatSize(item.size)}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                {item.kind === "folder" ? (
                  <ProgressNavLink
                    href={withQuery(`/my-files/${encodeURIComponent(item.id)}`, { view: viewMode })}
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Open Folder
                  </ProgressNavLink>
                ) : (
                  <ProgressNavLink
                    href={`/my-files/file/${encodeURIComponent(item.id)}`}
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    {item.isVideo ? "Play Video" : "Open File"}
                  </ProgressNavLink>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sortedVisibleItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="mb-3 inline-flex rounded-full border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {item.kind === "folder" ? "Folder" : "File"}
              </div>
              <h2 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                {item.kind === "file" && item.isVideo
                  ? (videoLabelById.get(item.id) ?? item.name)
                  : item.name}
              </h2>
              {item.kind === "file" && item.isVideo && (
                <p className="mt-1 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Original: {item.name}
                </p>
              )}
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
                    href={withQuery(`/my-files/${encodeURIComponent(item.id)}`, { view: viewMode })}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
