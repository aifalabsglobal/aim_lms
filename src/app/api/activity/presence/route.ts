import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PresencePayload = {
  path?: string;
};

function sanitizePath(path: string | undefined): string {
  if (!path) {
    return "/";
  }
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return "/";
  }
  return trimmed.slice(0, 255);
}

function sanitizeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) {
    return null;
  }
  return userAgent.slice(0, 255);
}

export async function POST(request: Request) {
  try {
    const appUser = await requireAppUser();
    const payload = (await request.json().catch(() => ({}))) as PresencePayload;
    const currentPath = sanitizePath(payload.path);
    const userAgent = sanitizeUserAgent(request.headers.get("user-agent"));

    await prisma.userPresence.upsert({
      where: { userId: appUser.id },
      update: {
        currentPath,
        userAgent,
        lastSeenAt: new Date(),
      },
      create: {
        userId: appUser.id,
        currentPath,
        userAgent,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update presence";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
