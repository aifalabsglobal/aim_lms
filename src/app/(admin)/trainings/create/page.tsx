import React from "react";
import CreateMeetingForm from "@/components/trainings/CreateMeetingForm";
import { getCurrentAppUser } from "@/lib/auth";

export default async function CreateTrainingPage() {
  const appUser = await getCurrentAppUser();
  const role = appUser?.role?.toLowerCase() ?? null;
  const canCreate = role === "admin" || role === "super_admin";

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
        <p className="font-medium">Access denied</p>
        <p className="mt-1">
          Only admins can create training meetings. Your current role is{" "}
          <span className="font-semibold">{role ?? "unknown"}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Create Training Meeting
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Admins can schedule Teams-based training meetings from AIM LMS.
        </p>
      </div>
      <CreateMeetingForm />
    </div>
  );
}
