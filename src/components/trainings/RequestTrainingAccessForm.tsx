"use client";

import { useEffect, useMemo, useState } from "react";

type RequestTrainingAccessFormProps = {
  courses: Array<{ id: string; name: string }>;
  selectedFolderId?: string;
};

type AccessRequestRow = {
  id: string;
  courseFolderId: string;
  courseName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt: string | null;
};

function statusClassName(status: AccessRequestRow["status"]): string {
  if (status === "APPROVED") {
    return "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300";
  }
  if (status === "REJECTED") {
    return "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300";
  }
  return "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300";
}

export default function RequestTrainingAccessForm({
  courses,
  selectedFolderId: selectedFolderIdProp,
}: RequestTrainingAccessFormProps) {
  const [selectedFolderId, setSelectedFolderId] = useState(courses[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!selectedFolderIdProp) {
      return;
    }
    const hasRequestedCourse = courses.some((course) => course.id === selectedFolderIdProp);
    if (hasRequestedCourse) {
      setSelectedFolderId(selectedFolderIdProp);
    }
  }, [courses, selectedFolderIdProp]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedFolderId) ?? null,
    [courses, selectedFolderId],
  );

  async function loadRequests() {
    try {
      const response = await fetch("/api/trainings/access-requests", { cache: "no-store" });
      const data = (await response.json()) as { requests?: AccessRequestRow[]; message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load requests");
      }
      setRequests(data.requests ?? []);
      setLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load requests");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCourse) {
      setError("Please choose a course");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/trainings/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: selectedCourse.id,
          courseName: selectedCourse.name,
        }),
      });
      const data = (await response.json()) as { requests?: AccessRequestRow[]; message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to submit request");
      }
      setRequests(data.requests ?? []);
      setLoaded(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Request Access</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You do not have access yet. Select a course and send access request to admin.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[280px] flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Course
          <select
            value={selectedFolderId}
            onChange={(event) => setSelectedFolderId(event.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isSubmitting || !selectedCourse}
          className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Request Access"}
        </button>
        <button
          type="button"
          onClick={loadRequests}
          className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {loaded ? "Refresh Requests" : "Load My Requests"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      {loaded && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">My Requests</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No requests yet.</p>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {request.courseName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Requested: {new Date(request.requestedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${statusClassName(
                    request.status,
                  )}`}
                >
                  {request.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
