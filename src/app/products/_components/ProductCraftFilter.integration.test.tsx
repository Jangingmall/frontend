import { render, screen } from "@testing-library/react";
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

import { ProductFilters } from "./ProductFilters";

vi.mock("@/lib/env", () => ({
  publicEnv: { apiMocking: false, productListApi: true },
}));

it("소재와 종목을 URL과 요청에서 제외한다", () => {
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

it("실제 API 모드에서는 분류와 가격 필터를 표시한다", () => {
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
  expect(screen.getByRole("button", { name: "다기 · 찻잔" })).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "소재" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "가격대" })).toBeVisible();
});

it("소분류가 아닌 소재는 빈 목록이고 공예 종목은 차단한다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  expect(await fetchProductMaterials("category-1")).toEqual([]);
  expect(fetchSpy).not.toHaveBeenCalled();
  await expect(fetchProductCrafts("category-1")).rejects.toThrow();
  expect(fetchSpy).not.toHaveBeenCalled();
});
