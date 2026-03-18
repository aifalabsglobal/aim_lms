import React from "react";
import { fetchTrainingsRecordingFiles, isCourseFolderUnlockedForViewer } from "@/lib/graph";
import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import { requireAppUser } from "@/lib/auth";
import RequestTrainingAccessForm from "@/components/trainings/RequestTrainingAccessForm";

export const dynamic = "force-dynamic";
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

export default async function TrainingsPage() {
  const appUser = await requireAppUser();
  const role = appUser.role?.toLowerCase() ?? "";
  const canManageAccess = role === "admin" || role === "super_admin";

  const recordings = await fetchTrainingsRecordingFiles({
    email: appUser.email ?? null,
    role: appUser.role ?? null,
    userId: appUser.id,
  }).catch((error) => ({
    errorMessage:
      error instanceof Error ? error.message : "Failed to load recordings folder",
  }));

  if ("errorMessage" in recordings) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
        {recordings.errorMessage}
      </div>
    );
  }

  const folderItems = recordings.items.filter((item) => item.kind === "folder");
  const unlockedByFolderId = new Map<string, boolean>();
  if (!canManageAccess) {
    const viewer = {
      email: appUser.email ?? null,
      role: appUser.role ?? null,
      userId: appUser.id,
    };
    const unlockedChecks = await Promise.all(
      folderItems.map(async (item) => {
        const unlocked = await isCourseFolderUnlockedForViewer(item.id, item.name, viewer).catch(
          () => false,
        );
        return { id: item.id, unlocked };
      }),
    );
    for (const entry of unlockedChecks) {
      unlockedByFolderId.set(entry.id, entry.unlocked);
    }
  }
  const sortedFolderItems = folderItems.slice().sort((a, b) => {
    if (!canManageAccess) {
      const aUnlocked = unlockedByFolderId.get(a.id) ?? false;
      const bUnlocked = unlockedByFolderId.get(b.id) ?? false;
      if (aUnlocked !== bUnlocked) {
        return aUnlocked ? -1 : 1;
      }
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  let requestableCourses: Array<{ id: string; name: string }> = [];
  if (!canManageAccess && recordings.folderId !== null && folderItems.length === 0) {
    const allRecordings = await fetchTrainingsRecordingFiles().catch(() => null);
    requestableCourses =
      allRecordings?.items
        ?.filter((item) => item.kind === "folder")
        .map((item) => ({ id: item.id, name: item.name }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })) ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Trainings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Showing files from OneDrive folder: {recordings.folderName}
          </p>
        </div>
        {canManageAccess && (
          <ProgressNavLink
            href="/my-files"
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Open My Files
          </ProgressNavLink>
        )}
      </div>

      {recordings.folderId === null ? (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-6 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
          `Recordings` folder was not found in My Files root.
        </div>
      ) : folderItems.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
            No folders found in the `Recordings` folder for your account.
          </div>
          {!canManageAccess && requestableCourses.length > 0 && (
            <RequestTrainingAccessForm courses={requestableCourses} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sortedFolderItems.map((item) => {
            const isUnlocked = !canManageAccess && (unlockedByFolderId.get(item.id) ?? false);
            const folderStatusLabel = canManageAccess
              ? "Admin"
              : isUnlocked
                ? "Unlocked"
                : "Preview";
            const folderStatusClass = canManageAccess
              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
              : isUnlocked
                ? "border-success-300 bg-success-50 text-success-700 dark:border-success-500/40 dark:bg-success-500/10 dark:text-success-300"
                : "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-200";
            return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white p-4 shadow-theme-xs dark:bg-white/[0.03] ${
                canManageAccess
                  ? "border-brand-300 ring-2 ring-brand-200/60 dark:border-brand-500/50 dark:ring-brand-500/20"
                  : isUnlocked
                    ? "border-success-300 ring-2 ring-success-200/60 dark:border-success-500/50 dark:ring-success-500/20"
                    : "border-warning-300 ring-2 ring-warning-200/60 dark:border-warning-500/40 dark:ring-warning-500/20"
              }`}
            >
              <div className="mb-3 inline-flex rounded-full border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
                Folder
              </div>
              <div
                className={`mb-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${folderStatusClass}`}
              >
                {folderStatusLabel}
              </div>
              <h2 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                {item.name}
              </h2>
              {!canManageAccess && (
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {isUnlocked
                    ? "Full access (enrolled/access granted)"
                    : "Preview unless enrolled or explicitly granted access"}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Modified: {formatDate(item.modifiedAt)}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Items: {item.childCount ?? 0}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <ProgressNavLink
                  href={`/my-files/${encodeURIComponent(item.id)}`}
                  className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                >
                  Open Videos
                </ProgressNavLink>
                {canManageAccess && (
                  <ProgressNavLink
                    href={`/trainings/folders/${encodeURIComponent(item.id)}/access`}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Manage Access
                  </ProgressNavLink>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
