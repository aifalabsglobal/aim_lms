import { requireAppUser } from "@/lib/auth";
import AdminShell from "@/layout/AdminShell";
import type { AppRole } from "@/layout/AppSidebar";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await requireAppUser();
  const role = (appUser.role?.toLowerCase() ?? null) as AppRole;
  return <AdminShell role={role}>{children}</AdminShell>;
}
