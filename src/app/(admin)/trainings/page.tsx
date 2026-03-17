import React from "react";
import Link from "next/link";
import { fetchTeamsTrainings } from "@/lib/graph";
import TrainingCardActions from "@/components/trainings/TrainingCardActions";
import ProgressNavLink from "@/components/trainings/ProgressNavLink";
import { requireAppUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 9;
const LAST_MONTHS_WINDOW = 4;

type PageSearchParams = Record<string, string | string[] | undefined>;

function formatDate(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatted = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `${formatted} IST`;
}

function getQueryValue(
  searchParams: PageSearchParams,
  key: string,
): string {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parsePage(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function getLastMonthsBoundary(monthsBack: number): Date {
  const boundary = new Date();
  boundary.setHours(0, 0, 0, 0);
  boundary.setMonth(boundary.getMonth() - monthsBack);
  return boundary;
}

function buildTrainingsUrl(
  page: number,
  query: string,
): string {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const queryString = params.toString();
  return queryString ? `/trainings?${queryString}` : "/trainings";
}

export default async function TrainingsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = getQueryValue(resolvedSearchParams, "q").trim();
  const requestedPage = parsePage(getQueryValue(resolvedSearchParams, "page"));
  const appUser = await requireAppUser();
  const role = appUser?.role?.toLowerCase() ?? null;
  const canManageTrainings = role === "admin" || role === "super_admin";

  let trainings = [] as Awaited<ReturnType<typeof fetchTeamsTrainings>>;
  let loadError: string | null = null;

  try {
    trainings = await fetchTeamsTrainings({
      email: appUser?.email ?? null,
      role: appUser?.role ?? null,
    });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load trainings";
  }

  const queryLower = query.toLowerCase();
  const fromBoundary = getLastMonthsBoundary(LAST_MONTHS_WINDOW);

  const filteredTrainings = trainings.filter((training) => {
    const searchable = [
      training.title,
      training.organizerName ?? "",
      training.organizerEmail ?? "",
    ]
      .join(" ")
      .toLowerCase();

    if (queryLower && !searchable.includes(queryLower)) {
      return false;
    }

    if (!training.startDateTime) {
      return false;
    }

    const start = new Date(training.startDateTime);
    if (Number.isNaN(start.getTime())) {
      return false;
    }
    if (start < fromBoundary) {
      return false;
    }

    return true;
  });

  const totalCount = filteredTrainings.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedTrainings = filteredTrainings.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {canManageTrainings ? "All Trainings" : "My Trainings"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {canManageTrainings
            ? `Teams trainings from the last ${LAST_MONTHS_WINDOW} months.`
            : `Trainings assigned to you from the last ${LAST_MONTHS_WINDOW} months.`}
        </p>
      </div>

      <form
        action="/trainings"
        method="get"
        className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by title or organizer"
            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-hidden focus:border-brand-500 dark:border-gray-700 dark:text-gray-200"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              Apply
            </button>
            <Link
              href="/trainings"
              className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      {loadError && (
        <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {loadError}
        </div>
      )}

      {!loadError && filteredTrainings.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
          No trainings match your filters.
        </div>
      )}

      {filteredTrainings.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, totalCount)} of{" "}
            {totalCount} trainings
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedTrainings.map((training) => (
            <div
              key={training.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                {training.title}
              </h2>

              <dl className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-200">
                    Starts
                  </dt>
                  <dd>{formatDate(training.startDateTime)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-200">
                    Ends
                  </dt>
                  <dd>{formatDate(training.endDateTime)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-200">
                    Organizer
                  </dt>
                  <dd>AIM Technologies</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-200">
                    Time Zone
                  </dt>
                  <dd>IST</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <ProgressNavLink
                  href={`/trainings/${encodeURIComponent(training.id)}`}
                  className="inline-flex items-center rounded-lg border border-brand-300 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-300 dark:hover:bg-brand-500/10"
                >
                  View Details
                </ProgressNavLink>
                {training.joinUrl && (
                  <a
                    href={training.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
                  >
                    Join Meeting
                  </a>
                )}
                {training.eventUrl && (
                  <a
                    href={training.eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    View Event
                  </a>
                )}
                {canManageTrainings && <TrainingCardActions trainingId={training.id} />}
              </div>
            </div>
            ))}
          </div>
        </>
      )}

      {!loadError && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <ProgressNavLink
            href={buildTrainingsUrl(currentPage - 1, query)}
            className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium ${
              currentPage === 1
                ? "pointer-events-none border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Previous
          </ProgressNavLink>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <ProgressNavLink
            href={buildTrainingsUrl(currentPage + 1, query)}
            className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium ${
              currentPage === totalPages
                ? "pointer-events-none border-gray-200 text-gray-400 dark:border-gray-800 dark:text-gray-600"
                : "border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Next
          </ProgressNavLink>
        </div>
      )}
    </div>
  );
}
