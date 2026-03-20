"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar, { type AppRole } from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import PresenceHeartbeat from "@/components/activity/PresenceHeartbeat";

type AdminShellProps = {
  children: React.ReactNode;
  role: AppRole;
};

export default function AdminShell({ children, role }: AdminShellProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <PresenceHeartbeat />
      <AppSidebar role={role} />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
