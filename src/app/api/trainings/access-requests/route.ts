import { requireAppUser } from "@/lib/auth";
import { listRecordingFolderAccess } from "@/lib/graph";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AccessRequestPayload = {
  folderId?: string;
  courseName?: string;
};

async function enrichRequestsWithGraphAccess<
  T extends { courseFolderId: string; userEmail?: string | null },
>(requests: T[], userEmail: string | null | undefined) {
  const normalizedUserEmail = userEmail?.trim().toLowerCase() ?? "";
  return Promise.all(
    requests.map(async (request) => {
      const allowedEmails = await listRecordingFolderAccess(request.courseFolderId).catch(
        (): string[] => [],
      );
      const hasAccess = normalizedUserEmail
        ? allowedEmails.includes(normalizedUserEmail)
        : false;
      return {
        ...request,
        hasAccess,
      };
    }),
  );
}

export async function GET() {
  try {
    const appUser = await requireAppUser();
    const requests = await prisma.recordingAccessRequest.findMany({
      where: { userId: appUser.id },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        courseFolderId: true,
        courseName: true,
        status: true,
        rejectionReason: true,
        requestedAt: true,
        reviewedAt: true,
      },
    });
    const enriched = await enrichRequestsWithGraphAccess(requests, appUser.email);
    return NextResponse.json({ requests: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load access requests";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const appUser = await requireAppUser();
    const payload = (await request.json()) as AccessRequestPayload;
    const folderId = payload.folderId?.trim() ?? "";
    const courseName = payload.courseName?.trim() ?? "";
    const userEmail = appUser.email?.trim().toLowerCase() ?? "";
    if (!folderId || !courseName) {
      return NextResponse.json({ message: "folderId and courseName are required" }, { status: 400 });
    }
    if (!userEmail) {
      return NextResponse.json(
        { message: "Your account email is missing. Contact admin." },
        { status: 400 },
      );
    }

    await prisma.recordingAccessRequest.upsert({
      where: {
        userId_courseFolderId: {
          userId: appUser.id,
          courseFolderId: folderId,
        },
      },
      update: {
        courseName,
        userEmail,
        status: "PENDING",
        rejectionReason: null,
        reviewedAt: null,
      },
      create: {
        userId: appUser.id,
        userEmail,
        courseFolderId: folderId,
        courseName,
        status: "PENDING",
      },
    });

    const requests = await prisma.recordingAccessRequest.findMany({
      where: { userId: appUser.id },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        courseFolderId: true,
        courseName: true,
        status: true,
        rejectionReason: true,
        requestedAt: true,
        reviewedAt: true,
      },
    });
    const enriched = await enrichRequestsWithGraphAccess(requests, userEmail);
    return NextResponse.json({ requests: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit access request";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
