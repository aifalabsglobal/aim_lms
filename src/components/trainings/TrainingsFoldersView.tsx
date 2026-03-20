"use client";

import { useMemo, useRef, useState } from "react";
import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import RequestTrainingAccessForm from "@/components/trainings/RequestTrainingAccessForm";

type TrainingFolderItem = {
  id: string;
  name: string;
  modifiedAt: string | null;
  childCount: number | null;
  isUnlocked: boolean;
};

type TrainingsFoldersViewProps = {
  items: TrainingFolderItem[];
  canManageAccess: boolean;
  requestableCourses: Array<{ id: string; name: string }>;
};

type AccessFilter = "all" | "unlocked" | "preview";
type ViewMode = "grid" | "list";

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

export default function TrainingsFoldersView({
  items,
  canManageAccess,
  requestableCourses,
}: TrainingsFoldersViewProps) {
  const topRequestFormRef = useRef<HTMLDivElement | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(requestableCourses[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (normalizedSearch && !item.name.toLowerCase().includes(normalizedSearch)) {
        return false;
      }
      if (canManageAccess || accessFilter === "all") {
        return true;
      }
      if (accessFilter === "unlocked") {
        return item.isUnlocked;
      }
      return !item.isUnlocked;
    });
  }, [accessFilter, canManageAccess, items, searchTerm]);

  return (
    <div className="space-y-4">
      {!canManageAccess && requestableCourses.length > 0 && (
        <div ref={topRequestFormRef}>
          <RequestTrainingAccessForm courses={requestableCourses} selectedFolderId={selectedCourseId} />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Search trainings</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by course name"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">View</span>
            <select
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as ViewMode)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </label>
        </div>

        {!canManageAccess && (
          <div className="mt-3">
            <label>
              <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Access filter</span>
              <select
                value={accessFilter}
                onChange={(event) => setAccessFilter(event.target.value as AccessFilter)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 md:w-64 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                <option value="all">All</option>
                <option value="unlocked">Unlocked</option>
                <option value="preview">Preview Only</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          No trainings match your current filters.
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" : "space-y-3"}>
          {filteredItems.map((item) => {
            const folderStatusLabel = canManageAccess
              ? "Admin"
              : item.isUnlocked
                ? "Unlocked"
                : "Preview";
            const folderStatusClass = canManageAccess
              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
              : item.isUnlocked
                ? "border-success-300 bg-success-50 text-success-700 dark:border-success-500/40 dark:bg-success-500/10 dark:text-success-300"
                : "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-200";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white p-4 shadow-theme-xs dark:bg-white/[0.03] ${
                  canManageAccess
                    ? "border-brand-300 ring-2 ring-brand-200/60 dark:border-brand-500/50 dark:ring-brand-500/20"
                    : item.isUnlocked
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
                <h2 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white/90">{item.name}</h2>
                {!canManageAccess && (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    {item.isUnlocked
                      ? "Full access (enrolled/access granted)"
                      : "Preview unless enrolled or explicitly granted access"}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Modified: {formatDate(item.modifiedAt)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Items: {item.childCount ?? 0}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ProgressNavLink
                    href={`/my-files/${encodeURIComponent(item.id)}`}
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Open Videos
                  </ProgressNavLink>
                  {!canManageAccess && !item.isUnlocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseId(item.id);
                        topRequestFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex items-center rounded-lg border border-warning-300 px-3 py-2 text-xs font-medium text-warning-700 hover:bg-warning-50 dark:border-warning-500/40 dark:text-warning-200 dark:hover:bg-warning-500/10"
                    >
                      Request Access
                    </button>
                  )}
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
            );
          })}
        </div>
      )}

      {!canManageAccess && requestableCourses.length > 0 && (
        <RequestTrainingAccessForm courses={requestableCourses} selectedFolderId={selectedCourseId} />
      )}
    </div>
  );
}
