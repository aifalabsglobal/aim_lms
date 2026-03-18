import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
                <Link href="/" className="mb-4">
                  <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-[0_0_40px_rgba(45,212,191,0.45)] ring-1 ring-white/60 dark:bg-gray-900/60 dark:shadow-[0_0_40px_rgba(56,189,248,0.45)] dark:ring-brand-500/30">
                    <Image
                      width={180}
                      height={56}
                      src="/images/logo/aim-logo.png"
                      alt="AIM Technologies"
                      priority
                    />
                  </div>
                </Link>
                <p className="text-center text-gray-400 dark:text-white/60">
                  AIM LMS - Learning platform for training delivery and tracking
                </p>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
