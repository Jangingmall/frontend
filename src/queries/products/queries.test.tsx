import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { delay, http } from "msw";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { useProductMaterials } from "./queries";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: true },
}));

it("분류 변경 시 이전 소재를 재사용하지 않고 바뀐 분류의 응답을 표시한다", async () => {
  server.use(
    http.get("*/api/products/materials", () =>
      mockOk([{ id: "clay", name: "백토" }]),
    ),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { result, rerender, unmount } = renderHook(
    ({ category }) => useProductMaterials(true, category),
    {
      initialProps: { category: "kitchen-1" },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  try {
    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: "clay", name: "백토" }]),
    );
    server.use(
      http.get("*/api/products/materials", async () => {
        await delay(30);
        return mockOk([{ id: "wood", name: "목재" }]);
      }),
    );
    rerender({ category: "kitchen-2" });
    expect(result.current.data).toBeUndefined();
    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: "wood", name: "목재" }]),
    );
  } finally {
    unmount();
    client.clear();
  }
});
