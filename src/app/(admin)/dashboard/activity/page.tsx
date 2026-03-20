import React from "react";
import LearnerAnalyticsPanel from "@/components/analytics/LearnerAnalyticsPanel";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardActivityPage() {
  await requireRole(["ADMIN", "SUPER_ADMIN"]);
  return <LearnerAnalyticsPanel />;
}
