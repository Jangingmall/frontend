"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useEffect, useState } from "react";

import { createQueryClient } from "@/lib/query/client";
import { useAuthStore } from "@/stores/auth";

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (
          state.user?.id !== previous.user?.id ||
          state.accessToken?.startsWith("mock-") !==
            previous.accessToken?.startsWith("mock-")
        )
          queryClient.clear();
      }),
    [queryClient],
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
