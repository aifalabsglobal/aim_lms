"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const routeKey = pathname;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [routeKey]);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
