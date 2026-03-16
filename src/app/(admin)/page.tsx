import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Admin Dashboard | Training Platform",
  description:
    "Operational dashboard for trainings, students, trainers, assessments, and reports.",
};

const statCards = [
  { label: "Active Trainings", value: "24", href: "/trainings" },
  { label: "Total Students", value: "1,280", href: "/students" },
  { label: "Active Trainers", value: "64", href: "/trainers" },
  { label: "Today Enrollments", value: "42", href: "/enrollments" },
];

const quickActions = [
  { title: "Create Training", description: "Add a new program", href: "/trainings/create" },
  { title: "Open Attendance", description: "Track daily attendance", href: "/students/attendance" },
  { title: "Assign Trainer", description: "Map trainer to sessions", href: "/trainers/assignments" },
  { title: "View Reports", description: "Check completion trends", href: "/reports/completion" },
];

const managementSections = [
  { title: "Trainings", links: [{ name: "All Trainings", href: "/trainings" }, { name: "Categories", href: "/trainings/categories" }, { name: "Batches/Sessions", href: "/trainings/sessions" }] },
  { title: "Students", links: [{ name: "All Students", href: "/students" }, { name: "Enrollments", href: "/enrollments" }, { name: "Progress", href: "/students/progress" }] },
  { title: "Trainers", links: [{ name: "All Trainers", href: "/trainers" }, { name: "Assignments", href: "/trainers/assignments" }, { name: "Availability", href: "/trainers/availability" }] },
  { title: "System", links: [{ name: "Users & Roles", href: "/admin/users" }, { name: "Settings", href: "/settings" }, { name: "Health/Diagnostics", href: "/admin/health" }] },
];

const pendingItems = [
  "Review 12 pending enrollments",
  "Publish 2 trainer assignments",
  "Verify weekly attendance gaps",
  "Check diagnostics and DB health",
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
          Training Platform Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage trainings, learners, trainers, assessments, and operations from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Quick Actions
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 dark:border-gray-700"
              >
                <p className="font-medium text-gray-800 dark:text-white/90">{action.title}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Pending Operations
          </h2>
          <ul className="mt-4 space-y-3">
            {pendingItems.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Management Sections
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {managementSections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <p className="mb-2 font-medium text-gray-800 dark:text-white/90">
                {section.title}
              </p>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-sm text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
