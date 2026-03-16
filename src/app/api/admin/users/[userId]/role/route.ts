import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireRole(["admin", "super_admin"]);

    const { userId } = await params;
    const body = (await request.json()) as { role?: string };
    const roleName = body.role?.trim().toUpperCase() as Role | undefined;
    const validRoles = new Set<Role>([
      Role.STUDENT,
      Role.TUTOR,
      Role.TRAINER,
      Role.STAFF,
      Role.COORDINATOR,
      Role.ADMIN,
      Role.SUPER_ADMIN,
    ]);

    if (!roleName || !validRoles.has(roleName)) {
      return NextResponse.json({ message: "Role is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: roleName },
    });

    return NextResponse.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      role: user.role?.toLowerCase() ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.error("Role update error", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
