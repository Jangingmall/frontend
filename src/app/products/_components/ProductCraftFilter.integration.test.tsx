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

it("소재 선택은 URL에 보존하되 미지원 API 요청에는 반영하지 않는다", () => {
  const params = new URLSearchParams(
    "category=다기-찻잔&subcategory=SAGI&material=WOOD&page=2",
  );
  const query = parseProductSearchParams(params);
  expect(query.crafts).toEqual(["SAGI"]);
  expect(query.materials).toEqual(["WOOD"]);
  const staleQuery = { ...query, crafts: ["SAGI"], materials: ["WOOD"] };
  const request = toProductListSearchParams(staleQuery);
  expect(request.has("subcategory")).toBe(true);
  expect(request.has("material")).toBe(true);
  expect(productKeys.list(staleQuery)).toEqual(productKeys.list(query));
  for (const patch of [
    { page: 3 },
    { crafts: ["YUGI"], materials: ["CLAY"] },
  ]) {
    const updated = updateProductSearchParams(params, patch);
    expect(updated.has("subcategory")).toBe(true);
    expect(updated.has("material")).toBe(true);
  }
  expect(
    getProductSeo({
      category: "다기-찻잔",
      subcategory: "SAGI",
      material: "WOOD",
    }).hasFilters,
  ).toBe(true);
});

it("실제 API 모드에서도 분류·소재·가격 필터를 표시한다", () => {
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
  expect(screen.getByRole("button", { name: "소재" })).toBeVisible();
  expect(screen.getByRole("button", { name: "가격대" })).toBeVisible();
});

it("소분류가 아닌 소재는 빈 목록이고 공예 종목은 MSW에서 조회한다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  expect(await fetchProductMaterials("category-1")).toEqual([]);
  expect(fetchSpy).not.toHaveBeenCalled();
  expect((await fetchProductCrafts("category-1")).length).toBeGreaterThan(0);
  expect(String(fetchSpy.mock.calls[0][0])).toContain(
    "/api/mock/catalogue/products/subcategories",
  );
});
