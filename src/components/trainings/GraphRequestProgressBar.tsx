"use client";

import React from "react";

type GraphRequestProgressBarProps = {
  active: boolean;
  label?: string;
  className?: string;
};

export default function GraphRequestProgressBar({
  active,
  label = "Contacting Microsoft Graph...",
  className = "mb-4",
}: GraphRequestProgressBarProps) {
  if (!active) {
    return null;
  }

  return (
    <div className={`${className} rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 dark:border-brand-500/30 dark:bg-brand-500/10`}>
      <p className="mb-2 text-xs font-medium text-brand-700 dark:text-brand-300">{label}</p>
      <div className="h-1.5 w-full overflow-hidden rounded bg-brand-200/70 dark:bg-brand-400/20">
        <div className="h-full w-1/3 animate-pulse rounded bg-brand-500" />
      </div>
    </div>
  );
}
