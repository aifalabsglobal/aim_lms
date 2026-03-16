import { requireRole } from "@/lib/auth";
import { deleteTeamsMeeting, updateTeamsMeeting } from "@/lib/graph";
import { NextResponse } from "next/server";

type UpdateMeetingRequest = {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  ownerUserId?: string;
};

function isValidIsoDateTime(value: string | undefined): value is string {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

type RouteContext = {
  params: Promise<{ trainingId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole(["admin", "super_admin"]);
    const { trainingId } = await context.params;
    if (!trainingId?.trim()) {
      return NextResponse.json({ message: "Training id is required" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateMeetingRequest;
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }
    if (!isValidIsoDateTime(body.startDateTime) || !isValidIsoDateTime(body.endDateTime)) {
      return NextResponse.json(
        { message: "Valid start and end datetime are required" },
        { status: 400 },
      );
    }

    const start = new Date(body.startDateTime);
    const end = new Date(body.endDateTime);
    if (start >= end) {
      return NextResponse.json(
        { message: "End datetime must be after start datetime" },
        { status: 400 },
      );
    }

    const updated = await updateTeamsMeeting({
      meetingId: trainingId,
      title,
      description: body.description,
      startDateTime: body.startDateTime,
      endDateTime: body.endDateTime,
      timeZone: body.timeZone || "Asia/Kolkata",
      ownerUserId: body.ownerUserId,
    });

    return NextResponse.json({ ok: true, meeting: updated }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        message: "Failed to update meeting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireRole(["admin", "super_admin"]);
    const { trainingId } = await context.params;
    if (!trainingId?.trim()) {
      return NextResponse.json({ message: "Training id is required" }, { status: 400 });
    }

    await deleteTeamsMeeting(trainingId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        message: "Failed to delete meeting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
