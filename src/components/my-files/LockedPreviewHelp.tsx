"use client";

import { useState } from "react";

export default function LockedPreviewHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-warning-300 px-3 py-2 text-xs font-medium text-warning-700 hover:bg-warning-50 dark:border-warning-500/40 dark:text-warning-200 dark:hover:bg-warning-500/10"
      >
        Why locked?
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Preview Mode
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This course is currently in preview mode for your account. Only the first video is
              unlocked. Request access from the Trainings page or wait for admin approval to unlock
              the full course.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 items-center rounded-lg bg-brand-500 px-3 text-xs font-medium text-white hover:bg-brand-600"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
