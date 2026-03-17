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
import { usePathname } from "next/navigation";

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
        className={`pointer-events-none fixed bottom-4 right-4 z-[190] transition-all duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-[250px] rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-900/95">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{message}</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded bg-brand-200/60 dark:bg-brand-400/20">
            <div className="h-full w-1/3 animate-pulse bg-brand-600" />
          </div>
        </div>
      </div>
    </>
  );
}

export function AppLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nextIdRef = useRef(1);
  const activeIdsRef = useRef<Set<number>>(new Set());
  const navigationIdsRef = useRef<Set<number>>(new Set());
  const navigationTimeoutsRef = useRef<Map<number, number>>(new Map());
  const [activeCount, setActiveCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("Loading...");
  const visibleSinceRef = useRef<number>(0);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

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
  }, [pathname]);

  useEffect(() => {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (activeCount > 0) {
      showTimerRef.current = window.setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setIsVisible(true);
      }, 80);
      return;
    }

    if (!isVisible) {
      return;
    }

    const elapsed = Date.now() - visibleSinceRef.current;
    const remaining = Math.max(0, 240 - elapsed);
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, remaining);
  }, [activeCount, isVisible]);

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
      if (!isApiCall) {
        return originalFetch(...args);
      }
      const token = startLoading("Loading data from Microsoft Graph...");
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
    return () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

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
      <GlobalLoadingIndicator visible={isVisible} message={message} />
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
