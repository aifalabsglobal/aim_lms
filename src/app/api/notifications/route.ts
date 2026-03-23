import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type NotificationItem = {
  id: string;
  type: "ACCESS_REQUEST_PENDING" | "ACCESS_REQUEST_REVIEWED";
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

type UserNotificationStateDelegate = {
  findUnique: (args: { where: { userId: string }; select: { lastReadAt: true } }) => Promise<{ lastReadAt: Date } | null>;
  upsert: (args: {
    where: { userId: string };
    update: { lastReadAt: Date };
    create: { userId: string; lastReadAt: Date };
  }) => Promise<unknown>;
};

function getNotificationStateDelegate(): UserNotificationStateDelegate | null {
  const delegate = (prisma as unknown as { userNotificationState?: UserNotificationStateDelegate })
    .userNotificationState;
  return delegate ?? null;
}

export async function GET() {
  try {
    const appUser = await requireAppUser();
    const role = appUser.role?.toLowerCase() ?? "";
    const isAdmin = role === "admin" || role === "super_admin";

    let notifications: NotificationItem[] = [];

    if (isAdmin) {
      const pendingRequests = await prisma.recordingAccessRequest.findMany({
        where: { status: "PENDING" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
        take: 20,
      });

      notifications = pendingRequests.map((request) => ({
        id: request.id,
        type: "ACCESS_REQUEST_PENDING",
        title: "New Access Request",
        message: `${request.user.name ?? request.user.email ?? "Learner"} requested access to ${request.courseName}.`,
        href: "/admin/users",
        createdAt: request.requestedAt.toISOString(),
      }));
    } else {
      const reviewedRequests = await prisma.recordingAccessRequest.findMany({
        where: {
          userId: appUser.id,
          status: { in: ["APPROVED", "REJECTED"] },
        },
        select: {
          id: true,
          status: true,
          courseName: true,
          rejectionReason: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });

      notifications = reviewedRequests.map((request) => ({
        id: request.id,
        type: "ACCESS_REQUEST_REVIEWED",
        title: request.status === "APPROVED" ? "Access Approved" : "Access Rejected",
        message:
          request.status === "APPROVED"
            ? `Your access request for ${request.courseName} has been approved.`
            : `Your access request for ${request.courseName} was rejected${request.rejectionReason ? `: ${request.rejectionReason}` : "."}`,
        href: "/trainings",
        createdAt: request.updatedAt.toISOString(),
      }));
    }

    let unreadCount = notifications.length;
    const notificationStateDelegate = getNotificationStateDelegate();
    if (notificationStateDelegate) {
      try {
        const notificationState = await notificationStateDelegate.findUnique({
          where: { userId: appUser.id },
          select: { lastReadAt: true },
        });
        const lastReadAt = notificationState?.lastReadAt ?? new Date(0);
        unreadCount = notifications.filter((item) => new Date(item.createdAt) > lastReadAt).length;
      } catch {
        // Fallback keeps notifications usable even if Prisma client is stale.
        unreadCount = notifications.length;
      }
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      viewAllHref: isAdmin ? "/admin/users" : "/trainings",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notifications";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const appUser = await requireAppUser();
    const now = new Date();
    const notificationStateDelegate = getNotificationStateDelegate();
    if (notificationStateDelegate) {
      try {
        await notificationStateDelegate.upsert({
          where: { userId: appUser.id },
          update: { lastReadAt: now },
          create: { userId: appUser.id, lastReadAt: now },
        });
      } catch {
        // Keep API successful so UI does not feel broken while schema/client catch up.
      }
    }
    return NextResponse.json({ ok: true, lastReadAt: now.toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark notifications as read";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
