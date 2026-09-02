"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";

export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
}

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
