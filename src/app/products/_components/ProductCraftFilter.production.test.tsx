import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  productCategories,
  productMaterials,
} from "@/api/products/mock/catalogue";
import { toProductListSearchParams } from "@/api/products/query";
import {
  parseProductSearchParams,
  updateProductSearchParams,
} from "@/app/products/_lib/search-params";
import { getProductSeo } from "@/app/products/_lib/seo";
import { productKeys } from "@/queries/products/keys";
import { useProductCrafts } from "@/queries/products/queries";

import { ProductFilters } from "./ProductFilters";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));

describe("실제 API 모드의 미지원 종목 필터", () => {
  const query = { category: "kitchen-1", crafts: ["1", "2"] };

  it("목록 요청과 캐시 키에서 종목을 제외한다", () => {
    expect(toProductListSearchParams(query).has("subcategory")).toBe(false);
    expect(productKeys.list(query)).toEqual(
      productKeys.list({ category: query.category }),
    );
  });

  it("직접 입력한 URL의 종목을 비활성 상태로 읽고 URL 갱신에서도 제거한다", () => {
    const params = new URLSearchParams(
      "category=kitchen-1&subcategory=1&subcategory=2",
    );
    expect(parseProductSearchParams(params).crafts).toEqual([]);
    expect(
      getProductSeo({ category: "kitchen-1", subcategory: ["1", "2"] })
        .hasFilters,
    ).toBe(false);
    expect(
      updateProductSearchParams(params, { page: 2 }).has("subcategory"),
    ).toBe(false);
    expect(
      updateProductSearchParams(params, { crafts: ["3"] }).has("subcategory"),
    ).toBe(false);
  });

  it("선택 데이터가 있어도 미지원 종목·소재 UI를 숨기고 가격 필터는 유지한다", () => {
    render(
      <ProductFilters
        query={query}
        category={productCategories[1]}
        categories={productCategories}
        crafts={[{ id: "1", name: "사기장" }]}
        materials={productMaterials}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "다기 · 찻잔" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "사기장" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가격대" })).toBeVisible();
    expect(
      screen.queryByRole("checkbox", { name: "선물 포장 가능" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "소재" }),
    ).not.toBeInTheDocument();
  });

  it("종목 선택지 조회도 시작하지 않는다", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result, unmount } = renderHook(() => useProductCrafts(true), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    expect(result.current.fetchStatus).toBe("idle");
    unmount();
    client.clear();
  });
});
