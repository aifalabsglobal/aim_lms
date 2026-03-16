import React from "react";
import { auth } from "@clerk/nextjs/server";
import { getCurrentAppUser } from "@/lib/auth";
import { getAuthReadinessSummary } from "@/lib/authConfig";

export default async function AdminHealthPage() {
  const session = await auth();
  const appUser = await getCurrentAppUser();
  const role = appUser?.role?.toLowerCase() ?? null;
  const canView = role === "admin" || role === "super_admin";

  if (!canView) {
    return (
      <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 text-sm text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-200">
        <p className="font-medium">Access denied</p>
        <p className="mt-1">
          Only admins can access auth diagnostics. Your current role is{" "}
          <span className="font-semibold">{role ?? "unknown"}</span>.
        </p>
      </div>
    );
  }

  const readiness = getAuthReadinessSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Health/Diagnostics
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Clerk authentication and app-user sync readiness checks.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Auth Readiness
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Status: {readiness.ready ? "Ready" : "Missing configuration"}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {readiness.checks.map((check) => (
            <li key={check.name} className="text-gray-700 dark:text-gray-300">
              {check.present ? "OK" : "Missing"} - {check.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Session/User Sync
        </h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <p>Session userId: {session.userId ?? "None"}</p>
          <p>DB user linked: {appUser ? "Yes" : "No"}</p>
          {appUser && (
            <>
              <p>DB role: {appUser.role ?? "None"}</p>
              <p>DB status: {appUser.status}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
