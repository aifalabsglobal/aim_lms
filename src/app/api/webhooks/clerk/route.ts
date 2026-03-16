import { prisma } from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/adminEmails";

type ClerkWebhookUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  email_addresses?: Array<{ email_address?: string }>;
};

function getPrimaryEmail(data: ClerkWebhookUser): string | null {
  const emailAddresses = data.email_addresses;
  return emailAddresses?.[0]?.email_address ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const svixId = req.headers.get("svix-id");
    if (!svixId) {
      return NextResponse.json(
        { ok: false, message: "Missing svix-id header" },
        { status: 400 },
      );
    }

    const existing = await prisma.clerkWebhookEvent.findUnique({
      where: { svixId },
    });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const event = (await verifyWebhook(req)) as WebhookEvent;

    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data as unknown as ClerkWebhookUser;
      const clerkUserId = data.id;
      const firstName = data.first_name ?? null;
      const lastName = data.last_name ?? null;
      const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
      const imageUrl = data.image_url ?? null;
      const email = getPrimaryEmail(data);
      const role = isAdminEmail(email) ? "ADMIN" : "STUDENT";

      await prisma.user.upsert({
        where: { clerkUserId },
        update: {
          email,
          name: fullName,
          imageUrl,
          role,
          status: "active",
        },
        create: {
          clerkUserId,
          email,
          name: fullName,
          imageUrl,
          role,
          status: "active",
        },
      });
    }

    if (event.type === "user.deleted") {
      const data = event.data as unknown as { id?: string | null };
      const clerkUserId = data.id ?? null;
      if (clerkUserId) {
        await prisma.user.deleteMany({
          where: { clerkUserId },
        });
      }
    }

    await prisma.clerkWebhookEvent.create({
      data: {
        svixId,
        eventType: event.type,
        status: "processed",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Clerk webhook error", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
