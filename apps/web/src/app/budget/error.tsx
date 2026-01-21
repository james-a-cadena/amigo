"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function BudgetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} context="Budget" />;
}
