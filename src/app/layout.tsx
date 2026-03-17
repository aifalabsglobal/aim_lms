import { Outfit } from 'next/font/google';
import type { Metadata } from "next";
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppLoadingProvider } from "@/context/AppLoadingContext";
import { ClerkProvider } from "@clerk/nextjs";
import RouteTransition from "@/components/common/RouteTransition";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AIM LMS",
    template: "%s | AIM LMS",
  },
  description: "AIM LMS - Training and learning management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ClerkProvider signInUrl="/signin" signUpUrl="/signup">
          <ThemeProvider>
            <AppLoadingProvider>
              <SidebarProvider>
                <RouteTransition>{children}</RouteTransition>
              </SidebarProvider>
            </AppLoadingProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
