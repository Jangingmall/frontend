import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import { parseProductSearchParams } from "@/app/products/_lib/search-params";

import { ProductListPage } from "./ProductListPage";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams(window.location.search || "category=category-1"),
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
          new URLSearchParams(window.location.search || "category=category-1"),
        )}
        initialCategories={mapBackendProductCategories([
          { categoryId: 1, name: "도자기" },
        ])}
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
    expect(screen.queryByRole("button", { name: "소재" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "선물 포장 가능" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "실제 상품 분류" }),
    ).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    unmount();
    client.clear();
  }
});

it("빈 결과 초기화는 선물 테마와 페이지를 URL에서 지우고 분류를 유지한다", async () => {
  const previousUrl = window.location.href;
  window.history.replaceState(
    null,
    "",
    "/products?category=category-1&giftTheme=housewarming&page=2&minPrice=5000",
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <ProductListPage
        initialQuery={parseProductSearchParams(
          new URLSearchParams(window.location.search),
        )}
        initialCategories={mapBackendProductCategories([
          { categoryId: 1, name: "도자기" },
        ])}
        initialData={{
          items: [],
          page: 2,
          pageSize: 20,
          totalCount: 0,
          totalPages: 1,
        }}
      />
    </QueryClientProvider>,
  );
  try {
    fireEvent.click(await screen.findByRole("button", { name: "필터 초기화" }));
    const params = new URLSearchParams(window.location.search);
    expect(params.has("giftTheme")).toBe(false);
    expect(params.has("page")).toBe(false);
    expect(params.has("minPrice")).toBe(false);
    expect(parseProductSearchParams(params)).toMatchObject({
      category: "category-1",
      giftTheme: undefined,
      page: 1,
    });
  } finally {
    unmount();
    client.clear();
    window.history.replaceState(null, "", previousUrl);
  }
});
