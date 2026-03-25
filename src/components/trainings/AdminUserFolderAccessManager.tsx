"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string;
  createdAt: string;
};

type FolderOption = {
  id: string;
  name: string;
};

type SummaryResponse = {
  users?: UserOption[];
  folders?: FolderOption[];
  message?: string;
};

type UserAccessResponse = {
  selectedFolderIds?: string[];
  message?: string;
};

type SaveResponse = {
  selectedFolderIds?: string[];
  addedCount?: number;
  removedCount?: number;
  message?: string;
};

export default function AdminUserFolderAccessManager() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userRecencyFilter, setUserRecencyFilter] = useState<"all" | "last_7_days" | "last_30_days">(
    "all",
  );
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const visibleFolders = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return folders;
    }
    return folders.filter((folder) => folder.name.toLowerCase().includes(normalized));
  }, [folders, searchTerm]);

  const visibleUsers = useMemo(() => {
    if (userRecencyFilter === "all") {
      return users;
    }
    const nowMs = Date.now();
    const thresholdMs =
      userRecencyFilter === "last_7_days"
        ? nowMs - 7 * 24 * 60 * 60 * 1000
        : nowMs - 30 * 24 * 60 * 60 * 1000;
    return users.filter((user) => {
      const createdAtMs = Date.parse(user.createdAt);
      return Number.isFinite(createdAtMs) && createdAtMs >= thresholdMs;
    });
  }, [userRecencyFilter, users]);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/users/recordings-access", { cache: "no-store" });
      const data = (await response.json()) as SummaryResponse;
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load user list");
      }

      const nextUsers = data.users ?? [];
      const nextFolders = data.folders ?? [];
      setUsers(nextUsers);
      setFolders(nextFolders);

      if (nextUsers.length === 0) {
        setSelectedUserId("");
        setSelectedFolderIds([]);
      } else if (!nextUsers.some((user) => user.id === selectedUserId)) {
        setSelectedUserId(nextUsers[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load user list");
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]);

  const loadUserAccess = useCallback(async (userId: string) => {
    if (!userId) {
      setSelectedFolderIds([]);
      return;
    }
    setIsLoadingAccess(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/recordings-access`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as UserAccessResponse;
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load current access");
      }
      setSelectedFolderIds(data.selectedFolderIds ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load current access");
      setSelectedFolderIds([]);
    } finally {
      setIsLoadingAccess(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }
    loadUserAccess(selectedUserId);
  }, [loadUserAccess, selectedUserId]);

  useEffect(() => {
    if (visibleUsers.length === 0) {
      setSelectedUserId("");
      setSelectedFolderIds([]);
      return;
    }
    if (!visibleUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(visibleUsers[0].id);
    }
  }, [selectedUserId, visibleUsers]);

  async function saveAccess() {
    if (!selectedUserId) {
      return;
    }
    setIsSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(selectedUserId)}/recordings-access`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderIds: selectedFolderIds }),
        },
      );
      const data = (await response.json()) as SaveResponse;
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to save folder access");
      }
      setSelectedFolderIds(data.selectedFolderIds ?? []);
      setFeedback(
        `Access saved. Added ${data.addedCount ?? 0}, removed ${data.removedCount ?? 0}.`,
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save folder access");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleFolder(folderId: string) {
    setSelectedFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  }

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  return (
    <div className="space-y-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Assign Folder Access To Users
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a non-admin user and choose which recordings folders they can access.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSummary}
          className="inline-flex h-9 items-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300">
          {feedback}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading users and folders...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No non-admin users found yet.
        </p>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">User Filter</span>
            <select
              value={userRecencyFilter}
              onChange={(event) =>
                setUserRecencyFilter(
                  event.target.value as "all" | "last_7_days" | "last_30_days",
                )
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="all">All non-admin users</option>
              <option value="last_7_days">New users (last 7 days)</option>
              <option value="last_30_days">New users (last 30 days)</option>
            </select>
          </label>

          {visibleUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No users match the selected recency filter.
            </p>
          ) : (
            <>
          <label className="block">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">User</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              {visibleUsers.map((user) => {
                const createdAtMs = Date.parse(user.createdAt);
                const isNewUser =
                  Number.isFinite(createdAtMs) &&
                  createdAtMs >= Date.now() - 7 * 24 * 60 * 60 * 1000;
                return (
                <option key={user.id} value={user.id}>
                  {(isNewUser ? "[NEW] " : "") +
                    (user.name?.trim() || "Unnamed user") +
                    " - " +
                    (user.email ?? "No email")}
                </option>
                );
              })}
            </select>
          </label>

          {selectedUser && (
            <p className="text-xs break-all text-gray-500 dark:text-gray-400">
              Editing: <span className="font-medium">{selectedUser.email ?? selectedUser.id}</span>
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
              Search folders
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Type folder name"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </label>

          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            {isLoadingAccess ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading current access...</p>
            ) : visibleFolders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No folders match your search.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {visibleFolders.map((folder) => (
                  <label
                    key={folder.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFolderIds.includes(folder.id)}
                      onChange={() => toggleFolder(folder.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="truncate">{folder.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selected folders: {selectedFolderIds.length}
            </p>
            <button
              type="button"
              onClick={saveAccess}
              disabled={!selectedUserId || isLoadingAccess || isSaving}
              className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Access"}
            </button>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
