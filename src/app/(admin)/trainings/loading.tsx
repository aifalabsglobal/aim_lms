export default function TrainingsLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Loading data from Microsoft Graph...
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-brand-200/60 dark:bg-brand-400/20">
          <div className="h-full w-1/3 animate-pulse rounded bg-brand-500" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" />
        <div className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" />
        <div className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]" />
      </div>
    </div>
  );
}
