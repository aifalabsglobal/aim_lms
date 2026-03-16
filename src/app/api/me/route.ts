import { getCurrentAppUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentAppUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    name: user.name,
    role: user.role?.toLowerCase() ?? null,
    status: user.status,
  });
}
