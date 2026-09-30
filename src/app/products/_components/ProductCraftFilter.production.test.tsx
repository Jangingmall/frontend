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

  it("실제 요청 계약은 유지하고 시연 캐시 키를 분리한다", () => {
    expect(toProductListSearchParams(query).has("subcategory")).toBe(false);
    expect(productKeys.list(query)).not.toEqual(
      productKeys.list({ category: query.category }),
    );
  });

  it("직접 입력한 URL의 종목 필터를 시연 쿼리로 보존한다", () => {
    const params = new URLSearchParams(
      "category=kitchen-1&subcategory=1&subcategory=2",
    );
    expect(parseProductSearchParams(params).crafts).toEqual(["1", "2"]);
    expect(
      getProductSeo({ category: "kitchen-1", subcategory: ["1", "2"] })
        .hasFilters,
    ).toBe(true);
    expect(
      updateProductSearchParams(params, { page: 2 }).has("subcategory"),
    ).toBe(true);
    expect(
      updateProductSearchParams(params, { crafts: ["3"] }).has("subcategory"),
    ).toBe(true);
  });

  it("분류와 가격을 유지하고 미지원 필터 시연을 표시한다", () => {
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
    expect(screen.getByRole("button", { name: "다기 · 찻잔" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "사기장" })).toBeVisible();
    expect(screen.getByRole("button", { name: "가격대" })).toBeVisible();
    expect(
      screen.queryByRole("checkbox", { name: "선물 포장 가능" }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: "소재" })).toBeVisible();
  });

  it("카테고리가 없는 경우 종목 선택지 조회를 시작하지 않는다", () => {
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
