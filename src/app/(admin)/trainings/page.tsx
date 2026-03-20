import React from "react";
import { fetchTrainingsRecordingFiles, isCourseFolderUnlockedForViewer } from "@/lib/graph";
import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import { requireAppUser } from "@/lib/auth";
import RequestTrainingAccessForm from "@/components/trainings/RequestTrainingAccessForm";
import TrainingsFoldersView from "@/components/trainings/TrainingsFoldersView";

export const dynamic = "force-dynamic";

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
  if (!canManageAccess && recordings.folderId !== null) {
    // Show the request form even when folders are visible (preview-only users still need access requests).
    const baseCourses = folderItems
      .map((item) => ({ id: item.id, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    if (baseCourses.length > 0) {
      requestableCourses = baseCourses;
    } else {
      const allRecordings = await fetchTrainingsRecordingFiles().catch(() => null);
      requestableCourses =
        allRecordings?.items
          ?.filter((item) => item.kind === "folder")
          .map((item) => ({ id: item.id, name: item.name }))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })) ?? [];
    }
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
        <TrainingsFoldersView
          items={sortedFolderItems.map((item) => ({
            id: item.id,
            name: item.name,
            modifiedAt: item.modifiedAt,
            childCount: item.childCount ?? null,
            isUnlocked: canManageAccess ? true : (unlockedByFolderId.get(item.id) ?? false),
          }))}
          canManageAccess={canManageAccess}
          requestableCourses={requestableCourses}
        />
      )}
    </div>
  );
}
