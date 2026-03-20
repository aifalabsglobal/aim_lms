"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyticsResponse = {
  metrics: {
    totalUsers: number;
    totalLearners: number;
    liveUsersNow: number;
    liveLearnersNow: number;
    activeLearners24h: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    pendingAccessRequests: number;
  };
  topCourses: Array<{
    courseId: string;
    courseName: string;
    learnerCount: number;
  }>;
  recentActivity: Array<{
    userName: string;
    email: string | null;
    role: string;
    userStatus: string;
    currentPath: string;
    lastSeenAt: string;
  }>;
};

type FetchState = {
  isLoading: boolean;
  error: string | null;
  data: AnalyticsResponse | null;
};

const REFRESH_MS = 20_000;

function formatLastSeen(value: string): string {
  return new Date(value).toLocaleString("en-IN");
}

export default function LearnerAnalyticsPanel() {
  const [state, setState] = useState<FetchState>({
    isLoading: true,
    error: null,
    data: null,
  });

  async function load(): Promise<void> {
    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const response = await fetch("/api/admin/analytics/learners", { cache: "no-store" });
      const payload = (await response.json()) as AnalyticsResponse & { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load learner analytics");
      }
      setState({ isLoading: false, error: null, data: payload });
    } catch (error) {
      setState({
        isLoading: false,
        data: null,
        error: error instanceof Error ? error.message : "Failed to load learner analytics",
      });
    }
  }

  useEffect(() => {
    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const cards = useMemo(() => {
    if (!state.data) {
      return [];
    }
    const { metrics } = state.data;
    return [
      { label: "Live Users Now", value: metrics.liveUsersNow.toString(), tone: "brand" },
      { label: "Live Learners", value: metrics.liveLearnersNow.toString(), tone: "success" },
      { label: "Learners (24h Active)", value: metrics.activeLearners24h.toString(), tone: "warning" },
      { label: "Total Learners", value: metrics.totalLearners.toString(), tone: "neutral" },
      { label: "Completion Rate", value: `${metrics.completionRate}%`, tone: "brand" },
      { label: "Pending Access Requests", value: metrics.pendingAccessRequests.toString(), tone: "warning" },
    ];
  }, [state.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Learner Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Progress, engagement, and live user monitoring (auto refresh every 20s).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {state.error && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {state.error}
        </div>
      )}

      {state.isLoading && !state.data ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          Loading analytics...
        </div>
      ) : state.data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border bg-white p-4 shadow-theme-xs dark:bg-white/[0.03] ${
                  card.tone === "brand"
                    ? "border-brand-300 dark:border-brand-500/40"
                    : card.tone === "success"
                      ? "border-success-300 dark:border-success-500/40"
                      : card.tone === "warning"
                        ? "border-warning-300 dark:border-warning-500/40"
                        : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Top Courses by Enrollment</h2>
              <div className="mt-3 space-y-2">
                {state.data.topCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No enrollment data yet.</p>
                ) : (
                  state.data.topCourses.map((course) => (
                    <div
                      key={course.courseId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                    >
                      <span className="line-clamp-1 text-gray-700 dark:text-gray-200">{course.courseName}</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {course.learnerCount} learners
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">Recent User Activity</h2>
              <div className="mt-3 max-h-[380px] space-y-2 overflow-auto pr-1">
                {state.data.recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity captured yet.</p>
                ) : (
                  state.data.recentActivity.map((entry, index) => (
                    <div
                      key={`${entry.email ?? entry.userName}-${entry.lastSeenAt}-${index}`}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-700 dark:text-gray-200">{entry.userName}</p>
                        <span className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] uppercase text-gray-600 dark:border-gray-700 dark:text-gray-300">
                          {entry.role}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">{entry.email ?? "No email"}</p>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Path: <span className="font-mono">{entry.currentPath}</span>
                      </p>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Last seen: {formatLastSeen(entry.lastSeenAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
