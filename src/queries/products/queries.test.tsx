import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { delay, http } from "msw";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { useProductMaterials } from "./queries";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));

it("분류 변경 시 이전 소재를 재사용하지 않고 바뀐 분류의 응답을 표시한다", async () => {
  server.use(
    http.get("*/api/products/categories", () =>
      mockOk([
        { code: "TEA", name: "다기·찻잔" },
        { code: "DISH", name: "그릇·접시" },
      ]),
    ),
    http.get("*/api/products/materials", async ({ request }) => {
      const category = new URL(request.url).searchParams.get("category");
      if (category === "TEA") return mockOk(["백토"]);
      if (category === "DISH") {
        await delay(30);
        return mockOk(["목재"]);
      }
      return mockOk([]);
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { result, rerender, unmount } = renderHook(
    ({ category }) => useProductMaterials(true, category),
    {
      initialProps: { category: "다기-찻잔" },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  try {
    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: "백토", name: "백토" }]),
    );
    rerender({ category: "그릇-접시" });
    expect(result.current.data).toBeUndefined();
    await waitFor(() =>
      expect(result.current.data).toEqual([{ id: "목재", name: "목재" }]),
    );
  } finally {
    unmount();
    client.clear();
  }
});
