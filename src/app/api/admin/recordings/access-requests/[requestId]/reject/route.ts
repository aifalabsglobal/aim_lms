import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

type RejectPayload = {
  reason?: string;
};

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 500;

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const { requestId } = await params;
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      return NextResponse.json({ message: "Invalid request id" }, { status: 400 });
    }

    const payload = (await request.json()) as RejectPayload;
    const reason = payload.reason?.trim() ?? "";
    if (reason.length < MIN_REASON_LENGTH) {
      return NextResponse.json(
        { message: `Rejection reason must be at least ${MIN_REASON_LENGTH} characters.` },
        { status: 400 },
      );
    }
    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { message: `Rejection reason must be at most ${MAX_REASON_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const existing = await prisma.recordingAccessRequest.findUnique({
      where: { id: normalizedRequestId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Access request not found" }, { status: 404 });
    }

    await prisma.recordingAccessRequest.update({
      where: { id: normalizedRequestId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reject access request";
    if (message.toLowerCase() === "forbidden") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (message.toLowerCase() === "unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (message.toLowerCase().includes("unexpected end of json input")) {
      return NextResponse.json({ message: "Reason is required to reject access." }, { status: 400 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
