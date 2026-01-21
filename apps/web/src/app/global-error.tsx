"use client";

import { useEffect } from "react";

const isDev = process.env.NODE_ENV === "development";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log errors appropriately based on environment
    if (isDev) {
      // In development, log full error for debugging
      console.error("Global error:", error);
    } else {
      // In production, log minimal info (digest is safe to log)
      console.error("Global error occurred", error.digest ? `(digest: ${error.digest})` : "");
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>

          <p className="mb-6 max-w-md text-muted-foreground">
            We encountered an unexpected error. Please try again.
          </p>

          {isDev && error.message && (
            <pre className="mb-6 max-w-md overflow-auto rounded-md bg-red-100 p-3 text-left text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error.message}
            </pre>
          )}

          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
