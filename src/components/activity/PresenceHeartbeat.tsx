"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 30_000;

async function sendHeartbeat(pathname: string): Promise<void> {
  try {
    await fetch("/api/activity/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    });
  } catch {
    // Presence pings are best-effort and should never block user flow.
  }
}

export default function PresenceHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    void sendHeartbeat(pathname);
    const intervalId = window.setInterval(() => {
      void sendHeartbeat(pathname);
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [pathname]);

  return null;
}
