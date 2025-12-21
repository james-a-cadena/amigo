"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

// Hook to detect if we're on the client (avoids hydration mismatch)
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Don't render theme-specific content until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <button
        className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle theme"
        title="Theme"
      >
        <Monitor className="h-5 w-5" />
      </button>
    );
  }

  const displayTheme = theme ?? "system";

  return (
    <button
      onClick={cycleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      aria-label={`Current theme: ${displayTheme}. Click to change.`}
      title={`Theme: ${displayTheme}`}
    >
      {displayTheme === "light" && <Sun className="h-5 w-5" />}
      {displayTheme === "dark" && <Moon className="h-5 w-5" />}
      {displayTheme === "system" && <Monitor className="h-5 w-5" />}
    </button>
  );
}
