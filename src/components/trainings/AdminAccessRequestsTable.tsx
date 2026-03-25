"use client";

import { useEffect, useMemo, useState } from "react";

type AccessRequestRow = {
  id: string;
  courseFolderId: string;
  courseName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  hasAccess: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    status: string;
  };
};

type FeedbackState = {
  kind: "success" | "error";
  message: string;
} | null;

function statusBadge(status: AccessRequestRow["status"], hasAccess: boolean): string {
  if (hasAccess) {
    return "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300";
  }
  if (status === "APPROVED") {
    return "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300";
  }
  if (status === "REJECTED") {
    return "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300";
  }
  return "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300";
}

export default function AdminAccessRequestsTable() {
  const REJECT_REASON_MIN_LENGTH = 3;
  const [rows, setRows] = useState<AccessRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccessRequestRow["status"]>("all");
  const [accessFilter, setAccessFilter] = useState<"all" | "has_access" | "needs_access">("all");
  const [rejectTargetIds, setRejectTargetIds] = useState<string[]>([]);
  const [rejectContextLabel, setRejectContextLabel] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/recordings/access-requests", { cache: "no-store" });
      const data = (await response.json()) as { requests?: AccessRequestRow[]; message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load access requests");
      }
      setRows(data.requests ?? []);
      setSelectedIds((current) => current.filter((id) => (data.requests ?? []).some((row) => row.id === id)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load access requests");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function approveRequest(requestId: string) {
    setActiveId(requestId);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/admin/recordings/access-requests/${encodeURIComponent(requestId)}/approve`,
        { method: "POST" },
      );
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to approve access");
      }
      await load();
      setFeedback({ kind: "success", message: "Access approved successfully." });
    } catch (approveError) {
      const message = approveError instanceof Error ? approveError.message : "Failed to approve access";
      setError(message);
      setFeedback({ kind: "error", message });
    } finally {
      setActiveId(null);
    }
  }

  async function revokeRequest(requestId: string) {
    setActiveId(requestId);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/admin/recordings/access-requests/${encodeURIComponent(requestId)}/revoke`,
        { method: "POST" },
      );
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to revoke access");
      }
      await load();
      setFeedback({ kind: "success", message: "Access revoked successfully." });
    } catch (revokeError) {
      const message = revokeError instanceof Error ? revokeError.message : "Failed to revoke access";
      setError(message);
      setFeedback({ kind: "error", message });
    } finally {
      setActiveId(null);
    }
  }

  function openRejectModal(row: AccessRequestRow) {
    setRejectTargetIds([row.id]);
    setRejectContextLabel(row.courseName);
    setRejectReason(row.rejectionReason ?? "");
    setError(null);
    setFeedback(null);
  }

  function openBulkRejectModal() {
    const targets = selectedFilteredRows.filter((row) => !row.hasAccess);
    if (targets.length === 0) {
      const message = "Select at least one row that does not already have access.";
      setError(message);
      setFeedback({ kind: "error", message });
      return;
    }
    setRejectTargetIds(targets.map((row) => row.id));
    setRejectContextLabel(`${targets.length} selected request${targets.length === 1 ? "" : "s"}`);
    setRejectReason("");
    setError(null);
    setFeedback(null);
  }

  function closeRejectModal() {
    if (isRejecting) {
      return;
    }
    setRejectTargetIds([]);
    setRejectContextLabel("");
    setRejectReason("");
  }

  async function rejectRequest() {
    if (rejectTargetIds.length === 0) {
      return;
    }
    const reason = rejectReason.trim();
    if (reason.length < REJECT_REASON_MIN_LENGTH) {
      const message = `Please enter at least ${REJECT_REASON_MIN_LENGTH} characters for rejection reason.`;
      setError(message);
      setFeedback({ kind: "error", message });
      return;
    }

    setIsRejecting(true);
    const isBulkReject = rejectTargetIds.length > 1;
    if (isBulkReject) {
      setIsBulkSaving(true);
    } else {
      setActiveId(rejectTargetIds[0]);
    }
    setError(null);
    setFeedback(null);
    try {
      const settled = await Promise.allSettled(
        rejectTargetIds.map((requestId) =>
          fetch(`/api/admin/recordings/access-requests/${encodeURIComponent(requestId)}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          }).then(async (response) => {
            const data = (await response.json()) as { message?: string };
            if (!response.ok) {
              throw new Error(data.message ?? "Failed to reject access");
            }
            return true;
          }),
        ),
      );

      const successCount = settled.filter((entry) => entry.status === "fulfilled").length;
      const failedCount = settled.length - successCount;
      if (successCount === 0) {
        throw new Error("Failed to reject selected requests");
      }

      await load();
      if (isBulkReject) {
        setSelectedIds([]);
      }
      setFeedback(
        failedCount > 0
          ? {
              kind: "error",
              message: `Reject completed with partial failures (${successCount} succeeded, ${failedCount} failed).`,
            }
          : {
              kind: "success",
              message: `Rejected ${successCount} request${successCount === 1 ? "" : "s"}.`,
            },
      );
      setRejectTargetIds([]);
      setRejectContextLabel("");
      setRejectReason("");
    } catch (rejectError) {
      const message = rejectError instanceof Error ? rejectError.message : "Failed to reject access";
      setError(message);
      setFeedback({ kind: "error", message });
    } finally {
      setIsRejecting(false);
      setIsBulkSaving(false);
      setActiveId(null);
    }
  }

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      if (accessFilter === "has_access" && !row.hasAccess) {
        return false;
      }
      if (accessFilter === "needs_access" && row.hasAccess) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const userName = row.user.name?.toLowerCase() ?? "";
      const userEmail = row.user.email?.toLowerCase() ?? "";
      const courseName = row.courseName.toLowerCase();
      const userStatus = row.user.status.toLowerCase();

      return (
        userName.includes(normalizedSearch) ||
        userEmail.includes(normalizedSearch) ||
        courseName.includes(normalizedSearch) ||
        userStatus.includes(normalizedSearch)
      );
    });
  }, [accessFilter, rows, searchTerm, statusFilter]);

  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "all" || accessFilter !== "all";
  const filteredRowIds = filteredRows.map((row) => row.id);
  const selectedFilteredIds = selectedIds.filter((id) => filteredRowIds.includes(id));
  const selectedFilteredRows = filteredRows.filter((row) => selectedFilteredIds.includes(row.id));
  const canBulkRevoke = selectedFilteredRows.some((row) => row.hasAccess);
  const canBulkReject = selectedFilteredRows.some((row) => !row.hasAccess);

  async function runBulkAction(action: "approve" | "revoke") {
    if (selectedFilteredIds.length === 0) {
      return;
    }
    setIsBulkSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const targets =
        action === "revoke"
          ? filteredRows.filter((row) => selectedFilteredIds.includes(row.id) && row.hasAccess)
          : filteredRows.filter((row) => selectedFilteredIds.includes(row.id));
      if (targets.length === 0) {
        setFeedback({
          kind: "error",
          message: action === "revoke" ? "Select at least one row with access to revoke." : "No rows selected.",
        });
        return;
      }

      const settled = await Promise.allSettled(
        targets.map((row) =>
          fetch(
            `/api/admin/recordings/access-requests/${encodeURIComponent(row.id)}/${action === "approve" ? "approve" : "revoke"}`,
            { method: "POST" },
          ).then(async (response) => {
            const data = (await response.json()) as { message?: string };
            if (!response.ok) {
              throw new Error(data.message ?? `Failed to ${action} access`);
            }
            return true;
          }),
        ),
      );

      const successCount = settled.filter((entry) => entry.status === "fulfilled").length;
      const failedCount = settled.length - successCount;
      await load();
      setSelectedIds([]);
      if (failedCount > 0) {
        setFeedback({
          kind: "error",
          message: `${action === "approve" ? "Approve" : "Revoke"} completed with partial failures (${successCount} succeeded, ${failedCount} failed).`,
        });
      } else {
        setFeedback({
          kind: "success",
          message: `${action === "approve" ? "Approved" : "Revoked"} ${successCount} request${successCount === 1 ? "" : "s"}.`,
        });
      }
    } catch (bulkError) {
      const message = bulkError instanceof Error ? bulkError.message : `Failed to ${action} selected requests`;
      setError(message);
      setFeedback({ kind: "error", message });
    } finally {
      setIsBulkSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 sm:text-xl">User Access Requests</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review requested courses and approve or reject access.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
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
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300"
              : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search user, email, course"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | AccessRequestRow["status"])
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Access</span>
            <select
              value={accessFilter}
              onChange={(event) =>
                setAccessFilter(event.target.value as "all" | "has_access" | "needs_access")
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="all">All Access States</option>
              <option value="has_access">Has Access</option>
              <option value="needs_access">Needs Access</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredRows.length} of {rows.length} requests
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedFilteredIds.length === 0 || isBulkSaving}
              onClick={() => runBulkAction("approve")}
              className="inline-flex h-8 items-center rounded-lg bg-brand-500 px-3 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isBulkSaving ? "Saving..." : `Bulk Approve (${selectedFilteredIds.length})`}
            </button>
            <button
              type="button"
              disabled={selectedFilteredIds.length === 0 || !canBulkRevoke || isBulkSaving}
              onClick={() => runBulkAction("revoke")}
              className="inline-flex h-8 items-center rounded-lg border border-error-300 px-3 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
            >
              {isBulkSaving ? "Saving..." : "Bulk Revoke"}
            </button>
            <button
              type="button"
              disabled={selectedFilteredIds.length === 0 || !canBulkReject || isBulkSaving}
              onClick={openBulkRejectModal}
              className="inline-flex h-8 items-center rounded-lg border border-error-300 px-3 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
            >
              {isBulkSaving ? "Saving..." : `Bulk Reject (${selectedFilteredIds.length})`}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setAccessFilter("all");
                }}
                className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            Loading requests...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            No access requests match your filters.
          </div>
        ) : (
          filteredRows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {row.user.name || "Unknown User"}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-gray-500 dark:text-gray-400">
                    {row.user.email || row.user.status}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={(event) => {
                    setSelectedIds((current) =>
                      event.target.checked
                        ? Array.from(new Set([...current, row.id]))
                        : current.filter((id) => id !== row.id),
                    );
                  }}
                  aria-label={`Select request from ${row.user.name || row.user.email || "user"}`}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </div>

              <div className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <p>
                  <span className="font-medium">Course:</span> {row.courseName}
                </p>
                <p>
                  <span className="font-medium">Requested:</span>{" "}
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(row.requestedAt).toLocaleString("en-IN")}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">Access:</span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge(
                      row.status,
                      row.hasAccess,
                    )}`}
                  >
                    {row.hasAccess ? "HAS_ACCESS" : row.status === "APPROVED" ? "APPROVED_PENDING_SYNC" : row.status}
                  </span>
                </p>
                {row.rejectionReason && (
                  <p className="break-words text-error-700 dark:text-error-300">
                    <span className="font-medium">Reason:</span> {row.rejectionReason}
                  </p>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => approveRequest(row.id)}
                  disabled={activeId === row.id || isBulkSaving}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-500 px-3 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {activeId === row.id ? "Saving..." : row.hasAccess ? "Re-Approve" : "Approve"}
                </button>
                {!row.hasAccess ? (
                  <button
                    type="button"
                    onClick={() => openRejectModal(row)}
                    disabled={activeId === row.id || isBulkSaving}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-error-300 px-3 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
                  >
                    {activeId === row.id ? "Saving..." : "Reject"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => revokeRequest(row.id)}
                    disabled={activeId === row.id || isBulkSaving}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-error-300 px-3 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
                  >
                    {activeId === row.id ? "Saving..." : "Revoke"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] lg:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={filteredRowIds.length > 0 && selectedFilteredIds.length === filteredRowIds.length}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedIds((current) => Array.from(new Set([...current, ...filteredRowIds])));
                    } else {
                      setSelectedIds((current) => current.filter((id) => !filteredRowIds.includes(id)));
                    }
                  }}
                  aria-label="Select all filtered requests"
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-gray-500 dark:text-gray-400">
                  Loading requests...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-gray-500 dark:text-gray-400">
                  No access requests match your filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800/70">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked
                            ? Array.from(new Set([...current, row.id]))
                            : current.filter((id) => id !== row.id),
                        );
                      }}
                      aria-label={`Select request from ${row.user.name || row.user.email || "user"}`}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 break-words">
                    {row.user.name || "Unknown User"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 break-all">
                    {row.user.email || row.user.status}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 break-words">{row.courseName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(row.requestedAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${statusBadge(
                        row.status,
                        row.hasAccess,
                      )}`}
                    >
                      {row.hasAccess ? "HAS_ACCESS" : row.status === "APPROVED" ? "APPROVED_PENDING_SYNC" : row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 break-words">
                    {row.rejectionReason ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => approveRequest(row.id)}
                        disabled={activeId === row.id || isBulkSaving}
                        className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                      >
                        {activeId === row.id ? "Saving..." : row.hasAccess ? "Re-Approve" : "Approve"}
                      </button>
                      {!row.hasAccess && (
                        <button
                          type="button"
                          onClick={() => openRejectModal(row)}
                          disabled={activeId === row.id || isBulkSaving}
                          className="inline-flex items-center rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
                        >
                          {activeId === row.id ? "Saving..." : "Reject"}
                        </button>
                      )}
                      {row.hasAccess && (
                        <button
                          type="button"
                          onClick={() => revokeRequest(row.id)}
                          disabled={activeId === row.id || isBulkSaving}
                          className="inline-flex items-center rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-50 disabled:opacity-60 dark:border-error-600/40 dark:text-error-300 dark:hover:bg-error-500/10"
                        >
                          {activeId === row.id ? "Saving..." : "Revoke"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rejectTargetIds.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {rejectTargetIds.length > 1 ? "Bulk Reject Access Requests" : "Reject Access Request"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Provide a reason for rejecting access to <span className="font-medium">{rejectContextLabel}</span>.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              This will reject {rejectTargetIds.length} request{rejectTargetIds.length === 1 ? "" : "s"}.
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Reason</span>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Add a clear reason so the learner knows what to do next."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{rejectReason.trim().length}/500 characters</p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isRejecting}
                className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={rejectRequest}
                disabled={isRejecting || rejectReason.trim().length < REJECT_REASON_MIN_LENGTH}
                className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-error-300 bg-error-50 px-3 text-xs font-medium text-error-700 hover:bg-error-100 disabled:opacity-60 dark:border-error-600/40 dark:bg-error-500/10 dark:text-error-300 dark:hover:bg-error-500/20 sm:w-auto"
              >
                {isRejecting ? "Saving..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
