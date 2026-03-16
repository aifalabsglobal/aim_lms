import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/adminEmails";

export type AppUserWithRole = Awaited<ReturnType<typeof getCurrentAppUser>>;

export async function getCurrentAppUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (existingUser) {
    const shouldBeAdmin = isAdminEmail(existingUser.email);
    if (shouldBeAdmin && existingUser.role !== "ADMIN") {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: { role: "ADMIN" },
      });
    }
    return existingUser;
  }

  // Webhook delivery can lag; this keeps auth usable on first login.
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  const fullName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const role = isAdminEmail(email) ? "ADMIN" : "STUDENT";

  return prisma.user.create({
    data: {
      clerkUserId: clerkUser.id,
      email,
      name: fullName || null,
      imageUrl: clerkUser.imageUrl ?? null,
      role,
      status: "active",
    },
  });
}

export async function requireAppUser() {
  const user = await getCurrentAppUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAppUser();
  const roleName = user.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

  if (!roleName || !normalizedAllowedRoles.includes(roleName)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
