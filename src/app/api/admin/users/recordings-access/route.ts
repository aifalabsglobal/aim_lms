import { requireRole } from "@/lib/auth";
import { fetchTrainingsRecordingFiles } from "@/lib/graph";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    const [users, recordings] = await Promise.all([
      prisma.user.findMany({
        where: {
          email: { not: null },
          NOT: [{ role: "ADMIN" }, { role: "SUPER_ADMIN" }],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      fetchTrainingsRecordingFiles({ role: "ADMIN", email: null, userId: null }),
    ]);

    const folders = recordings.items
      .filter((item) => item.kind === "folder")
      .map((item) => ({ id: item.id, name: item.name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    return NextResponse.json({ users, folders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users and folders";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
