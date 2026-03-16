import { requireRole } from "@/lib/auth";
import { createTeamsMeeting, sendTrainingInviteEmails } from "@/lib/graph";
import { NextResponse } from "next/server";

type CreateMeetingRequest = {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  attendeeEmails?: string[];
  ownerUserId?: string;
};

function isAccessDeniedGraphMailError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("erroraccessdenied") ||
    message.includes("access is denied") ||
    message.includes("graph request failed: 403")
  );
}

function isValidIsoDateTime(value: string | undefined): value is string {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

export async function POST(request: Request) {
  try {
    await requireRole(["admin", "super_admin"]);

    const body = (await request.json()) as CreateMeetingRequest;
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

    const result = await createTeamsMeeting({
      title,
      description: body.description,
      startDateTime: body.startDateTime,
      endDateTime: body.endDateTime,
      timeZone: body.timeZone || "Asia/Kolkata",
      attendeeEmails: body.attendeeEmails ?? [],
      ownerUserId: body.ownerUserId,
    });

    let inviteWarning: string | null = null;
    try {
      await sendTrainingInviteEmails(result, body.attendeeEmails ?? []);
    } catch (emailError) {
      // Meeting calendar invites are already sent by Graph event creation.
      // If tenant blocks app Mail.Send, suppress noisy warning.
      if (!isAccessDeniedGraphMailError(emailError)) {
        inviteWarning =
          emailError instanceof Error ? emailError.message : "Unknown email delivery error";
      }
    }

    return NextResponse.json(
      { ok: true, meeting: result, inviteWarning },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      {
        message: "Failed to create meeting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
