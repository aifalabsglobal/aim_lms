"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

type NotificationItem = {
  id: string;
  type: "ACCESS_REQUEST_PENDING" | "ACCESS_REQUEST_REVIEWED";
  title: string;
  message: string;
  href: string;
  createdAt: string;
};

const POLL_INTERVAL_MS = 30_000;

function formatRelativeTime(value: string): string {
  const then = new Date(value).getTime();
  const now = Date.now();
  const seconds = Math.max(1, Math.floor((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [viewAllHref, setViewAllHref] = useState("/trainings");
  const [unreadCount, setUnreadCount] = useState(0);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setUnreadCount(0);
    } catch {
      // Best effort; unread count will refresh on next poll.
    }
  }

  const handleClick = async () => {
    toggleDropdown();
    if (!isOpen) {
      await markAllAsRead();
    }
  };

  async function loadNotifications() {
    setError(null);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = (await response.json()) as {
        notifications?: NotificationItem[];
        unreadCount?: number;
        message?: string;
        viewAllHref?: string;
      };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load notifications");
      }
      setNotifications(data.notifications ?? []);
      setViewAllHref(data.viewAllHref ?? "/trainings");
      setUnreadCount(data.unreadCount ?? 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const headerTitle = unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications";

  function itemTone(type: NotificationItem["type"]): string {
    if (type === "ACCESS_REQUEST_PENDING") {
      return "bg-warning-500";
    }
    return "bg-success-500";
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            unreadCount === 0 ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {headerTitle}
          </h5>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Mark all read
            </button>
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</li>
          ) : error ? (
            <li className="px-4 py-3 text-sm text-error-700 dark:text-error-300">{error}</li>
          ) : notifications.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No notifications yet.</li>
          ) : (
            notifications.map((item) => (
              <li key={item.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                  href={item.href}
                >
                  <span className="relative mt-0.5 block h-2.5 w-2.5 rounded-full bg-gray-300">
                    <span className={`absolute inset-0 rounded-full ${itemTone(item.type)}`} />
                  </span>
                  <span className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.title}
                    </span>
                    <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                      {item.message}
                    </span>
                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span>{item.type === "ACCESS_REQUEST_PENDING" ? "Access Request" : "Review"}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                      <span>{formatRelativeTime(item.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        <Link
          href={viewAllHref}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Notifications
        </Link>
      </Dropdown>
    </div>
  );
}
