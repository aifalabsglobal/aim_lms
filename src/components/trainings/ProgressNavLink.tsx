"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAppLoading } from "@/context/AppLoadingContext";
import Link from "next/link";

type ProgressNavLinkProps = {
  href: string;
  className: string;
  children: React.ReactNode;
};

export default function ProgressNavLink({ href, className, children }: ProgressNavLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { startNavigationLoading } = useAppLoading();

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault();
        if (isPending) {
          return;
        }
        startNavigationLoading("Loading page...");
        startTransition(() => {
          router.push(href);
        });
      }}
      aria-disabled={isPending}
      className={`relative overflow-hidden ${isPending ? "pointer-events-none cursor-wait opacity-80" : ""} ${className}`}
    >
      {children}
      {isPending && (
        <>
          <span className="pointer-events-none fixed left-0 top-0 z-[90] h-1 w-full bg-brand-200/80 dark:bg-brand-400/20">
            <span className="block h-full w-1/3 animate-pulse bg-brand-600" />
          </span>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-brand-300/70">
            <span className="block h-full w-1/3 animate-pulse bg-brand-600" />
          </span>
        </>
      )}
    </Link>
  );
}
