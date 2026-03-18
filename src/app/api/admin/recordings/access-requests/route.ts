import { listRecordingFolderAccess } from "@/lib/graph";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const requests = await prisma.recordingAccessRequest.findMany({
      orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    const rows = await Promise.all(
      requests.map(async (request) => {
        const allowedEmails = await listRecordingFolderAccess(request.courseFolderId).catch(
          (): string[] => [],
        );
        const normalizedUserEmail = request.userEmail.trim().toLowerCase();
        const hasAccess = allowedEmails.includes(normalizedUserEmail);
        return {
          id: request.id,
          courseFolderId: request.courseFolderId,
          courseName: request.courseName,
          status: request.status,
          requestedAt: request.requestedAt,
          reviewedAt: request.reviewedAt,
          hasAccess,
          user: request.user,
        };
      }),
    );

    return NextResponse.json({ requests: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load access requests";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
