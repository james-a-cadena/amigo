"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@amigo/ui/components/button";

const isDev = process.env.NODE_ENV === "development";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Show "Go to Dashboard" link (hide for global error which can't navigate) */
  showHomeLink?: boolean;
  /** Context name for logging (e.g., "Dashboard", "Groceries") */
  context?: string;
}

export function ErrorFallback({
  error,
  reset,
  showHomeLink = true,
  context = "App",
}: ErrorFallbackProps) {
  useEffect(() => {
    // Log errors appropriately based on environment
    if (isDev) {
      // In development, log full error for debugging
      console.error(`${context} error:`, error);
    } else {
      // In production, log minimal info (digest is safe to log)
      console.error(`${context} error occurred`, error.digest ? `(digest: ${error.digest})` : "");
    }
  }, [error, context]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center">
      <Image
        src="/amigo-PWA-192x192.png"
        alt="amigo"
        width={64}
        height={64}
        className="mb-6 opacity-50"
      />

      <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>

      <p className="mb-6 max-w-md text-muted-foreground">
        We encountered an unexpected error. Please try again.
      </p>

      {isDev && error.message && (
        <pre className="mb-6 max-w-md overflow-auto rounded-md bg-destructive/10 p-3 text-left text-xs text-destructive">
          {error.message}
        </pre>
      )}

      <div className="flex gap-3">
        <Button onClick={reset}>Try Again</Button>
        {showHomeLink && (
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
