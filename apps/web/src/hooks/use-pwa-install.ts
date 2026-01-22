"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function subscribeToDisplayMode(callback: () => void): () => void {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getIsInstalledSnapshot(): boolean {
  if (typeof window === "undefined") return false;

  // Check standalone mode
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // iOS Safari check
  if (
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone: boolean }).standalone
  ) {
    return true;
  }

  return false;
}

function getServerIsInstalled(): boolean {
  return false;
}

export function usePWAInstall(): {
  isInstalled: boolean;
  isInstallable: boolean;
  install: () => Promise<boolean>;
} {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const isInstalled = useSyncExternalStore(
    subscribeToDisplayMode,
    getIsInstalledSnapshot,
    getServerIsInstalled
  );

  useEffect(() => {
    if (isInstalled) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return { isInstalled, isInstallable, install };
}
