import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

type AdminComingSoonProps = {
  title: string;
  description: string;
};

export default function AdminComingSoon({
  title,
  description,
}: AdminComingSoonProps) {
  return (
    <div>
      <PageBreadcrumb pageTitle={title} />
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[720px] text-center">
          <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
