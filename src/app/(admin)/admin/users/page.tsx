import React from "react";
import { requireRole } from "@/lib/auth";
import AdminAccessRequestsTable from "@/components/trainings/AdminAccessRequestsTable";
import AdminUserFolderAccessManager from "@/components/trainings/AdminUserFolderAccessManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  return (
    <div className="space-y-6">
      <AdminUserFolderAccessManager />
      <AdminAccessRequestsTable />
    </div>
  );
}
