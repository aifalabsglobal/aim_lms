import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/adminEmails";

export type AppUserWithRole = Awaited<ReturnType<typeof getCurrentAppUser>>;

export async function getCurrentAppUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  const clerkEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? null;
  const clerkName = clerkUser
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null
    : null;
  const clerkImageUrl = clerkUser?.imageUrl ?? null;

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (existingUser) {
    const normalizedExistingEmail = existingUser.email?.trim().toLowerCase() ?? null;
    const normalizedClerkEmail = clerkEmail?.trim().toLowerCase() ?? null;
    const emailOutOfSync = normalizedExistingEmail !== normalizedClerkEmail;
    const missingProfileFields = !existingUser.name || !existingUser.imageUrl;
    const shouldBeAdmin = isAdminEmail(clerkEmail ?? existingUser.email);
    const needsRoleUpdate = shouldBeAdmin && existingUser.role !== "ADMIN";

    if (emailOutOfSync || missingProfileFields || needsRoleUpdate) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: clerkEmail,
          name: clerkName ?? existingUser.name,
          imageUrl: clerkImageUrl ?? existingUser.imageUrl,
          role: shouldBeAdmin ? "ADMIN" : existingUser.role ?? "STUDENT",
        },
      });
    }
    return existingUser;
  }

  // Webhook delivery can lag; this keeps auth usable on first login.
  if (!clerkUser) {
    return null;
  }

  const role = isAdminEmail(clerkEmail) ? "ADMIN" : "STUDENT";

  return prisma.user.create({
    data: {
      clerkUserId: clerkUser.id,
      email: clerkEmail,
      name: clerkName,
      imageUrl: clerkImageUrl,
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
