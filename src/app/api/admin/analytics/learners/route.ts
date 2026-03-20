import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(1));
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const now = Date.now();
    const liveThreshold = new Date(now - 5 * 60 * 1000);
    const active24hThreshold = new Date(now - 24 * 60 * 60 * 1000);

    const [
      totalLearners,
      totalUsers,
      liveUsersNow,
      liveLearnersNow,
      activeLearners24h,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      pendingAccessRequests,
      recentPresence,
      topCourseCounts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count(),
      prisma.userPresence.count({ where: { lastSeenAt: { gte: liveThreshold } } }),
      prisma.userPresence.count({
        where: {
          lastSeenAt: { gte: liveThreshold },
          user: { role: "STUDENT" },
        },
      }),
      prisma.userPresence.count({
        where: {
          lastSeenAt: { gte: active24hThreshold },
          user: { role: "STUDENT" },
        },
      }),
      prisma.enrollment.count(),
      prisma.enrollment.count({
        where: { status: { equals: "active", mode: "insensitive" } },
      }),
      prisma.enrollment.count({
        where: {
          OR: [
            { status: { equals: "completed", mode: "insensitive" } },
            { status: { equals: "done", mode: "insensitive" } },
          ],
        },
      }),
      prisma.recordingAccessRequest.count({
        where: { status: "PENDING" },
      }),
      prisma.userPresence.findMany({
        where: { lastSeenAt: { gte: active24hThreshold } },
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

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalLearners,
        liveUsersNow,
        liveLearnersNow,
        activeLearners24h,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: percentage(completedEnrollments, totalEnrollments),
        pendingAccessRequests,
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
