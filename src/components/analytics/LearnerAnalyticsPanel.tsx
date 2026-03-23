"use client";

import { useEffect, useMemo, useState } from "react";

type AnalyticsRange = "7d" | "30d" | "all";

type AnalyticsResponse = {
  range: AnalyticsRange;
  metrics: {
    totalUsers: number;
    totalLearners: number;
    totalTrainers: number;
    liveUsersNow: number;
    liveLearnersNow: number;
    activeLearners24h: number;
    inactiveLearners24h: number;
    totalCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    otherEnrollments: number;
    learnersWithoutEnrollment: number;
    completionRate: number;
    totalAccessRequests: number;
    pendingAccessRequests: number;
    approvedAccessRequests: number;
    rejectedAccessRequests: number;
    accessReviewRate: number;
    accessApprovalRate: number;
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

function percentOf(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(1));
}

function rangeLabel(range: AnalyticsRange): string {
  if (range === "7d") {
    return "7d";
  }
  if (range === "30d") {
    return "30d";
  }
  return "all-time";
}

export default function LearnerAnalyticsPanel() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [state, setState] = useState<FetchState>({
    isLoading: true,
    error: null,
    data: null,
  });

  async function load(selectedRange: AnalyticsRange = range): Promise<void> {
    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      const response = await fetch(`/api/admin/analytics/learners?range=${selectedRange}`, { cache: "no-store" });
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
    void load(range);
    const intervalId = window.setInterval(() => {
      void load(range);
    }, REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [range]);

  const cards = useMemo(() => {
    if (!state.data) {
      return [];
    }
    const { metrics } = state.data;
    const activeRangeLabel = state.data.range === "all" ? "All-time Active Learners" : `Learners (${rangeLabel(state.data.range)} Active)`;
    return [
      { label: "Live Users Now", value: metrics.liveUsersNow.toString(), tone: "brand" },
      { label: "Live Learners", value: metrics.liveLearnersNow.toString(), tone: "success" },
      { label: activeRangeLabel, value: metrics.activeLearners24h.toString(), tone: "warning" },
      { label: "Inactive Learners", value: metrics.inactiveLearners24h.toString(), tone: "neutral" },
      { label: "Total Learners", value: metrics.totalLearners.toString(), tone: "neutral" },
      { label: "Total Users", value: metrics.totalUsers.toString(), tone: "neutral" },
      { label: "Total Trainers", value: metrics.totalTrainers.toString(), tone: "neutral" },
      { label: "Published Courses", value: `${metrics.publishedCourses}/${metrics.totalCourses}`, tone: "brand" },
      { label: "Total Enrollments", value: metrics.totalEnrollments.toString(), tone: "brand" },
      { label: "Learners Without Enrollment", value: metrics.learnersWithoutEnrollment.toString(), tone: "warning" },
      { label: "Completion Rate", value: `${metrics.completionRate}%`, tone: "brand" },
      { label: "Access Review Rate", value: `${metrics.accessReviewRate}%`, tone: "success" },
      { label: "Access Approval Rate", value: `${metrics.accessApprovalRate}%`, tone: "success" },
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
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            Range
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as AnalyticsRange)}
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load(range)}
            className="inline-flex h-9 items-center rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Enrollment Breakdown ({state.data.range === "all" ? "all-time" : rangeLabel(state.data.range)})
              </h2>
              <div className="mt-3 space-y-3">
                {[
                  {
                    label: "Active",
                    value: state.data.metrics.activeEnrollments,
                    percent: percentOf(state.data.metrics.activeEnrollments, state.data.metrics.totalEnrollments),
                    barClass: "bg-brand-500",
                  },
                  {
                    label: "Completed",
                    value: state.data.metrics.completedEnrollments,
                    percent: percentOf(state.data.metrics.completedEnrollments, state.data.metrics.totalEnrollments),
                    barClass: "bg-success-500",
                  },
                  {
                    label: "Other",
                    value: state.data.metrics.otherEnrollments,
                    percent: percentOf(state.data.metrics.otherEnrollments, state.data.metrics.totalEnrollments),
                    barClass: "bg-warning-500",
                  },
                ].map((entry) => (
                  <div key={entry.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>{entry.label}</span>
                      <span>
                        {entry.value} ({entry.percent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-2 rounded-full ${entry.barClass}`} style={{ width: `${entry.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Access Request Breakdown ({state.data.range === "all" ? "all-time" : rangeLabel(state.data.range)})
              </h2>
              <div className="mt-3 space-y-3">
                {[
                  {
                    label: "Pending",
                    value: state.data.metrics.pendingAccessRequests,
                    percent: percentOf(
                      state.data.metrics.pendingAccessRequests,
                      state.data.metrics.totalAccessRequests,
                    ),
                    barClass: "bg-warning-500",
                  },
                  {
                    label: "Approved",
                    value: state.data.metrics.approvedAccessRequests,
                    percent: percentOf(
                      state.data.metrics.approvedAccessRequests,
                      state.data.metrics.totalAccessRequests,
                    ),
                    barClass: "bg-success-500",
                  },
                  {
                    label: "Rejected",
                    value: state.data.metrics.rejectedAccessRequests,
                    percent: percentOf(
                      state.data.metrics.rejectedAccessRequests,
                      state.data.metrics.totalAccessRequests,
                    ),
                    barClass: "bg-error-500",
                  },
                ].map((entry) => (
                  <div key={entry.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span>{entry.label}</span>
                      <span>
                        {entry.value} ({entry.percent}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-2 rounded-full ${entry.barClass}`} style={{ width: `${entry.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Top Courses by Enrollment ({state.data.range === "all" ? "all-time" : rangeLabel(state.data.range)})
              </h2>
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
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Recent User Activity ({state.data.range === "all" ? "all-time" : rangeLabel(state.data.range)})
              </h2>
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
