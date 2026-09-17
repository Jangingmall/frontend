import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductListPage } from "./ProductListPage";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("category=다기-찻잔"),
}));

it("실제 API 모드에서 비활성 소재 조회를 기다리지 않고 가격 필터를 표시한다", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <ProductListPage
        initialQuery={parseProductSearchParams(
          new URLSearchParams("category=다기-찻잔"),
        )}
        initialCategories={mapBackendProductCategories([])}
        initialData={{
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 1,
        }}
      />
    </QueryClientProvider>,
  );
  try {
    expect(await screen.findByRole("button", { name: "가격대" })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "총 0개의 검색 결과",
      ),
    );
    expect(
      screen.queryByRole("button", { name: "소재" }),
    ).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    unmount();
    client.clear();
  }
});
