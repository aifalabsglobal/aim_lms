import { requireRole } from "@/lib/auth";
import { listRecordingFolderAccess, removeRecordingFolderAccess } from "@/lib/graph";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function POST(_: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { requestId } = await params;
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
    }

    const request = await prisma.recordingAccessRequest.findUnique({
      where: { id: normalizedRequestId },
      select: {
        id: true,
        userEmail: true,
        courseFolderId: true,
      },
    });
    if (!request) {
      return NextResponse.json({ message: "Access request not found" }, { status: 404 });
    }

    await removeRecordingFolderAccess(request.courseFolderId, request.userEmail);
    const normalizedUserEmail = request.userEmail.trim().toLowerCase();
    const allowedEmails = await listRecordingFolderAccess(request.courseFolderId).catch(
      (): string[] => [],
    );
    const revoked = !allowedEmails.includes(normalizedUserEmail);
    if (!revoked) {
      return NextResponse.json(
        { message: "Revoke could not be verified yet. Please retry after a few seconds." },
        { status: 409 },
      );
    }

    await prisma.recordingAccessRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to revoke access";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
