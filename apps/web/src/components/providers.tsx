"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ConfirmProvider } from "@/components/confirm-provider";
import { PushPromptProvider } from "@/components/push-prompt-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <PushPromptProvider>{children}</PushPromptProvider>
      </ConfirmProvider>
    </QueryClientProvider>
  );
}
