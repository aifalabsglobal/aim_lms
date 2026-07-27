import { requireRole } from "@/lib/auth";
import { addRecordingFolderAccess, listRecordingFolderAccess } from "@/lib/graph";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function grantAccessWithRetry(folderId: string, email: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await addRecordingFolderAccess(folderId, email);
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const retryable =
        message.includes("sharing failed") ||
        message.includes("graph request failed: 429") ||
        message.includes("graph request failed: 502") ||
        message.includes("graph request failed: 503") ||
        message.includes("graph request failed: 504") ||
        message.includes("fetch failed");
      if (!retryable || attempt >= 3) {
        throw error;
      }
      await sleep(1000 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to grant folder access");
}

async function verifyAccessWithRetry(folderId: string, email: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const allowedEmails = await listRecordingFolderAccess(folderId).catch((): string[] => []);
    if (allowedEmails.includes(email)) {
      return true;
    }
    if (attempt < 5) {
      await sleep(1000 * attempt);
    }
  }
  return false;
}

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

    await grantAccessWithRetry(request.courseFolderId, request.userEmail);
    const normalizedUserEmail = request.userEmail.trim().toLowerCase();
    const verified = await verifyAccessWithRetry(request.courseFolderId, normalizedUserEmail);
    if (!verified) {
      await prisma.recordingAccessRequest.update({
        where: { id: request.id },
        data: {
          status: "PENDING",
          reviewedAt: null,
          rejectionReason: null,
        },
      });
      return NextResponse.json(
        { message: "Approval could not be verified yet. Please retry after a few seconds." },
        { status: 409 },
      );
    }
    await prisma.recordingAccessRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve access request";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (message.toLowerCase().includes("sharing failed")) {
      return NextResponse.json({ message }, { status: 400 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
