"use client";

import { useEffect, useState } from "react";

type AccessRequestRow = {
  id: string;
  courseFolderId: string;
  courseName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
  const [rows, setRows] = useState<AccessRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

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
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load access requests");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approveRequest(requestId: string) {
    setActiveId(requestId);
    setError(null);
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
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Failed to approve access");
    } finally {
      setActiveId(null);
    }
  }

  async function revokeRequest(requestId: string) {
    setActiveId(requestId);
    setError(null);
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
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke access");
    } finally {
      setActiveId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">User Access Requests</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review requested courses and approve access.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
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

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-gray-500 dark:text-gray-400">
                  Loading requests...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-gray-500 dark:text-gray-400">
                  No access requests found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800/70">
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                    {row.user.name || "Unknown User"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {row.user.email || row.user.status}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.courseName}</td>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => approveRequest(row.id)}
                        disabled={activeId === row.id}
                        className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                      >
                        {activeId === row.id ? "Saving..." : row.hasAccess ? "Re-Approve" : "Approve"}
                      </button>
                      {row.hasAccess && (
                        <button
                          type="button"
                          onClick={() => revokeRequest(row.id)}
                          disabled={activeId === row.id}
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
    </div>
  );
}
