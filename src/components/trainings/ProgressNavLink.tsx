"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";

type ProgressNavLinkProps = {
  href: string;
  className: string;
  children: React.ReactNode;
};

export default function ProgressNavLink({ href, className, children }: ProgressNavLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(() => {
          router.push(href);
        });
      }}
      disabled={isPending}
      className={`relative overflow-hidden disabled:cursor-wait disabled:opacity-80 ${className}`}
    >
      {children}
      {isPending && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-brand-300/70">
          <span className="block h-full w-1/3 animate-pulse bg-brand-600" />
        </span>
      )}
    </button>
  );
}
