import { getAuthReadinessSummary } from "@/lib/authConfig";
import { getCurrentAppUser, requireRole } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole(["admin", "super_admin"]);
    const session = await auth();
    const appUser = await getCurrentAppUser();
    const readiness = getAuthReadinessSummary();

    return NextResponse.json({
      readiness,
      session: {
        userId: session.userId ?? null,
      },
      appUser: appUser
        ? {
            id: appUser.id,
            clerkUserId: appUser.clerkUserId,
            role: appUser.role,
            status: appUser.status,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        message: "Failed to load auth health",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
