"use client";

import React from "react";
import Link from "next/link";

type ProgressNavLinkProps = {
  href: string;
  className: string;
  children: React.ReactNode;
};

export default function ProgressNavLink({ href, className, children }: ProgressNavLinkProps) {
  return (
    <Link
      href={href}
      className={className}
    >
      {children}
    </Link>
  );
}
