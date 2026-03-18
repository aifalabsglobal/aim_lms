import React from "react";
import { requireRole } from "@/lib/auth";
import AdminAccessRequestsTable from "@/components/trainings/AdminAccessRequestsTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  return <AdminAccessRequestsTable />;
}
