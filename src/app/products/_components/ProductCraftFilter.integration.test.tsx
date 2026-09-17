import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import {
  fetchProductCrafts,
  fetchProductMaterials,
} from "@/api/products/client";
import { toProductListSearchParams } from "@/api/products/query";
import {
  parseProductSearchParams,
  updateProductSearchParams,
} from "@/app/products/_lib/search-params";
import { getProductSeo } from "@/app/products/_lib/seo";
import { productKeys } from "@/queries/products/keys";
import {
  useProductCrafts,
  useProductMaterials,
} from "@/queries/products/queries";

import { ProductFilters } from "./ProductFilters";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));

it("목록 설정을 켜도 미지원 종목·소재는 URL·요청·캐시·SEO에 반영하지 않는다", () => {
  const params = new URLSearchParams(
    "category=다기-찻잔&subcategory=SAGI&material=WOOD&page=2",
  );
  const query = parseProductSearchParams(params);
  expect(query.crafts).toEqual([]);
  expect(query.materials).toEqual([]);
  const staleQuery = { ...query, crafts: ["SAGI"], materials: ["WOOD"] };
  const request = toProductListSearchParams(staleQuery);
  expect(request.has("subcategory")).toBe(false);
  expect(request.has("material")).toBe(false);
  expect(productKeys.list(staleQuery)).toEqual(productKeys.list(query));
  for (const patch of [
    { page: 3 },
    { crafts: ["YUGI"], materials: ["CLAY"] },
  ]) {
    const updated = updateProductSearchParams(params, patch);
    expect(updated.has("subcategory")).toBe(false);
    expect(updated.has("material")).toBe(false);
  }
  expect(
    getProductSeo({
      category: "다기-찻잔",
      subcategory: "SAGI",
      material: "WOOD",
    }).hasFilters,
  ).toBe(false);
});

it("데이터가 남아 있어도 소재·종목 UI를 숨기고 가격 필터는 유지한다", () => {
  render(
    <ProductFilters
      query={{ category: "다기-찻잔", crafts: ["SAGI"], materials: ["WOOD"] }}
      category={{
        id: "다기-찻잔",
        name: "다기 · 찻잔",
        parentId: "키친-다이닝",
        description: "",
        minPrice: 1000,
        maxPrice: 9990000,
      }}
      categories={[]}
      materials={[{ id: "WOOD", name: "목재" }]}
      crafts={[{ id: "SAGI", name: "사기장" }]}
      onChange={vi.fn()}
      onReset={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "다기 · 찻잔" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "소재" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "가격대" })).toBeVisible();
});

it("목록 설정이 켜져 있어도 선택지 hook 및 직접 API 호출이 네트워크 요청을 보내지 않는다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { result, unmount } = renderHook(
    () => ({
      materials: useProductMaterials(true, "다기-찻잔"),
      crafts: useProductCrafts(true, "다기-찻잔"),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  try {
    expect(result.current.materials.fetchStatus).toBe("idle");
    expect(result.current.crafts.fetchStatus).toBe("idle");
    await expect(fetchProductMaterials("다기-찻잔")).rejects.toMatchObject({
      code: "PRODUCT_MATERIALS_NOT_READY",
    });
    await expect(fetchProductCrafts("다기-찻잔")).rejects.toMatchObject({
      code: "PRODUCT_CRAFTS_NOT_READY",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    unmount();
    client.clear();
  }
});
