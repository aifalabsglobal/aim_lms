"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

type AppLoadingContextValue = {
  isLoading: boolean;
  startLoading: (message?: string) => number;
  stopLoading: (id: number) => void;
  startNavigationLoading: (message?: string) => number;
};

const AppLoadingContext = createContext<AppLoadingContextValue | undefined>(undefined);

function isSameOriginNavigableLink(anchor: HTMLAnchorElement): boolean {
  if (!anchor.href) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }
  return true;
}

function GlobalLoadingIndicator({ visible, message }: { visible: boolean; message: string }) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-1 transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-full bg-brand-200/70 dark:bg-brand-400/25">
          <div className="h-full w-1/3 animate-pulse bg-brand-600" />
        </div>
      </div>
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-0 z-[190] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-white/35 dark:bg-gray-900/35" />
        <div className="absolute left-1/2 top-1/2 w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900/95">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function AppLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nextIdRef = useRef(1);
  const activeIdsRef = useRef<Set<number>>(new Set());
  const navigationIdsRef = useRef<Set<number>>(new Set());
  const navigationTimeoutsRef = useRef<Map<number, number>>(new Map());
  const [activeCount, setActiveCount] = useState(0);
  const [message, setMessage] = useState("Loading...");

  const startLoading = useCallback((nextMessage?: string) => {
    const id = nextIdRef.current++;
    activeIdsRef.current.add(id);
    setActiveCount(activeIdsRef.current.size);
    setMessage(nextMessage || "Loading...");
    return id;
  }, []);

  const stopLoading = useCallback((id: number) => {
    activeIdsRef.current.delete(id);
    navigationIdsRef.current.delete(id);
    const timeoutId = navigationTimeoutsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      navigationTimeoutsRef.current.delete(id);
    }
    setActiveCount(activeIdsRef.current.size);
  }, []);

  const startNavigationLoading = useCallback(
    (nextMessage?: string) => {
      const id = startLoading(nextMessage ?? "Loading page...");
      navigationIdsRef.current.add(id);
      const timeoutId = window.setTimeout(() => {
        stopLoading(id);
      }, 15000);
      navigationTimeoutsRef.current.set(id, timeoutId);
      return id;
    },
    [startLoading, stopLoading],
  );

  useEffect(() => {
    if (navigationIdsRef.current.size === 0) {
      return;
    }
    for (const id of Array.from(navigationIdsRef.current)) {
      activeIdsRef.current.delete(id);
      const timeoutId = navigationTimeoutsRef.current.get(id);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        navigationTimeoutsRef.current.delete(id);
      }
    }
    navigationIdsRef.current.clear();
    setActiveCount(activeIdsRef.current.size);
  }, [pathname, searchParams]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const requestUrl =
        typeof args[0] === "string"
          ? args[0]
          : args[0] instanceof URL
          ? args[0].href
          : args[0]?.url;
      const isApiCall = typeof requestUrl === "string" && requestUrl.includes("/api/");
      const token = startLoading(isApiCall ? "Loading data from Microsoft Graph..." : "Loading...");
      try {
        return await originalFetch(...args);
      } finally {
        stopLoading(token);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [startLoading, stopLoading]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!isSameOriginNavigableLink(anchor)) return;
      startNavigationLoading("Loading page...");
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [startNavigationLoading]);

  const value = useMemo<AppLoadingContextValue>(
    () => ({
      isLoading: activeCount > 0,
      startLoading,
      stopLoading,
      startNavigationLoading,
    }),
    [activeCount, startLoading, stopLoading, startNavigationLoading],
  );

  return (
    <AppLoadingContext.Provider value={value}>
      <GlobalLoadingIndicator visible={activeCount > 0} message={message} />
      {children}
    </AppLoadingContext.Provider>
  );
}

export function useAppLoading() {
  const context = useContext(AppLoadingContext);
  if (!context) {
    throw new Error("useAppLoading must be used within AppLoadingProvider");
  }
  return context;
}
