import { UserProfile } from "@clerk/nextjs";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Profile | AIM LMS",
  description:
    "This is the Next.js Profile page for AIM LMS.",
};

export default function Profile() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/[0.03] lg:p-4">
      <div className="overflow-hidden">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 bg-transparent",
            },
          }}
        />
      </div>
    </div>
  );
}
