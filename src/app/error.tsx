"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
      <div className="w-full max-w-lg rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-500/30 dark:bg-error-500/10">
        <h2 className="text-lg font-semibold text-error-800 dark:text-error-200">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-error-700 dark:text-error-300">
          {error.message || "Failed to load this page. Please try again."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
