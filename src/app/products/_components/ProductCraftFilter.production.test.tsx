import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, screen } from "@testing-library/react";
import { http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { fetchProductList } from "@/api/products/api";
import { fetchProductListClient } from "@/api/products/client";
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
import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
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

  it("연동 준비 설정이 꺼져 있으면 서버와 브라우저의 실제 목록 요청을 막는다", async () => {
    const requests: URLSearchParams[] = [];
    server.use(
      http.get("*/api/products", ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return mockOk({});
      }),
    );
    await expect(fetchProductList(query)).rejects.toMatchObject({
      code: "PRODUCT_LIST_API_NOT_READY",
    });
    await expect(fetchProductListClient(query)).rejects.toMatchObject({
      code: "PRODUCT_LIST_API_NOT_READY",
    });
    expect(requests).toHaveLength(0);
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

  it("선택 데이터가 있어도 종목 UI를 숨기고 기존 필터는 유지한다", () => {
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
    expect(screen.getByRole("button", { name: "소재" })).toBeVisible();
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
