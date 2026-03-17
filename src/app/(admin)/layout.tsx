"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  useEffect(() => {
    let isMounted = true;
    async function loadRole() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { role?: string | null };
        if (isMounted) {
          setRole(data.role?.toLowerCase() ?? null);
        }
      } catch {
        // no-op
      }
    }
    loadRole();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const isAdmin = role === "admin" || role === "super_admin";
    if (role && !isAdmin && !pathname.startsWith("/trainings")) {
      router.replace("/trainings");
    }
  }, [role, pathname, router]);

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
