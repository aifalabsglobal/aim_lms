import React from "react";

type StandardLoadingStateProps = {
  message?: string;
  centered?: boolean;
  skeletons?: string[];
};

export default function StandardLoadingState({
  message = "Loading...",
  centered = false,
  skeletons = [],
}: StandardLoadingStateProps) {
  if (centered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-brand-200/60 dark:bg-brand-400/20">
            <div className="h-full w-1/3 animate-pulse rounded bg-brand-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-brand-200/60 dark:bg-brand-400/20">
          <div className="h-full w-1/3 animate-pulse rounded bg-brand-500" />
        </div>
      </div>
      {skeletons.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skeletons.map((className, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={`${className}-${index}`}
              className={`animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
