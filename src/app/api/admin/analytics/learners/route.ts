import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

type RangeParam = "7d" | "30d" | "all";

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function normalizeRange(value: string | null): RangeParam {
  if (value === "7d" || value === "30d" || value === "all") {
    return value;
  }
  return "30d";
}

function getRangeStart(range: RangeParam, now: number): Date | null {
  if (range === "all") {
    return null;
  }
  const durationMs = range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - durationMs);
}

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const now = Date.now();
    const url = new URL(request.url);
    const range = normalizeRange(url.searchParams.get("range"));
    const liveThreshold = new Date(now - 5 * 60 * 1000);
    const rangeStart = getRangeStart(range, now);
    const activityThreshold = rangeStart ?? new Date(0);
    const enrollmentTimeWhere = rangeStart ? { createdAt: { gte: rangeStart } } : {};
    const accessTimeWhere = rangeStart ? { requestedAt: { gte: rangeStart } } : {};

    const [
      totalLearners,
      totalUsers,
      totalTrainers,
      liveUsersNow,
      liveLearnersNow,
      activeLearners24h,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      totalAccessRequests,
      pendingAccessRequests,
      approvedAccessRequests,
      rejectedAccessRequests,
      recentPresence,
      topCourseCounts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ["TRAINER", "TUTOR"] } } }),
      prisma.userPresence.count({ where: { lastSeenAt: { gte: liveThreshold } } }),
      prisma.userPresence.count({
        where: {
          lastSeenAt: { gte: liveThreshold },
          user: { role: "STUDENT" },
        },
      }),
      prisma.userPresence.count({
        where: {
          lastSeenAt: { gte: activityThreshold },
          user: { role: "STUDENT" },
        },
      }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count({ where: enrollmentTimeWhere }),
      prisma.enrollment.count({
        where: {
          ...enrollmentTimeWhere,
          status: { equals: "active", mode: "insensitive" },
        },
      }),
      prisma.enrollment.count({
        where: {
          ...enrollmentTimeWhere,
          OR: [
            { status: { equals: "completed", mode: "insensitive" } },
            { status: { equals: "done", mode: "insensitive" } },
          ],
        },
      }),
      prisma.recordingAccessRequest.count({ where: accessTimeWhere }),
      prisma.recordingAccessRequest.count({
        where: {
          ...accessTimeWhere,
          status: "PENDING",
        },
      }),
      prisma.recordingAccessRequest.count({
        where: {
          ...accessTimeWhere,
          status: "APPROVED",
        },
      }),
      prisma.recordingAccessRequest.count({
        where: {
          ...accessTimeWhere,
          status: "REJECTED",
        },
      }),
      prisma.userPresence.findMany({
        where: { lastSeenAt: { gte: activityThreshold } },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: { lastSeenAt: "desc" },
        take: 20,
      }),
      prisma.enrollment.groupBy({
        where: enrollmentTimeWhere,
        by: ["courseId"],
        _count: { _all: true },
        orderBy: { _count: { courseId: "desc" } },
        take: 5,
      }),
    ]);

    const topCourseIds = topCourseCounts.map((entry) => entry.courseId);
    const courses = topCourseIds.length
      ? await prisma.course.findMany({
          where: { id: { in: topCourseIds } },
          select: { id: true, title: true },
        })
      : [];
    const courseNameById = new Map(courses.map((course) => [course.id, course.title]));
    const otherEnrollments = Math.max(totalEnrollments - activeEnrollments - completedEnrollments, 0);
    const inactiveLearners24h = Math.max(totalLearners - activeLearners24h, 0);
    const learnersWithoutEnrollment = Math.max(totalLearners - totalEnrollments, 0);
    const accessReviewed = approvedAccessRequests + rejectedAccessRequests;

    return NextResponse.json({
      range,
      metrics: {
        totalUsers,
        totalLearners,
        totalTrainers,
        liveUsersNow,
        liveLearnersNow,
        activeLearners24h,
        inactiveLearners24h,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        otherEnrollments,
        learnersWithoutEnrollment,
        completionRate: percentage(completedEnrollments, totalEnrollments),
        totalAccessRequests,
        pendingAccessRequests,
        approvedAccessRequests,
        rejectedAccessRequests,
        accessReviewRate: percentage(accessReviewed, totalAccessRequests),
        accessApprovalRate: percentage(approvedAccessRequests, accessReviewed),
      },
      topCourses: topCourseCounts.map((entry) => ({
        courseId: entry.courseId,
        courseName: courseNameById.get(entry.courseId) ?? "Unknown Course",
        learnerCount: entry._count._all,
      })),
      recentActivity: recentPresence.map((entry) => ({
        userName: entry.user.name ?? "Unknown User",
        email: entry.user.email ?? null,
        role: entry.user.role ?? "UNKNOWN",
        userStatus: entry.user.status,
        currentPath: entry.currentPath ?? "/",
        lastSeenAt: entry.lastSeenAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
