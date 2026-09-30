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

it("미지원 필터는 UI URL에 남기고 실제 API의 요청 형식은 유지한다", () => {
  const params = new URLSearchParams(
    "category=다기-찻잔&subcategory=SAGI&material=WOOD&page=2",
  );
  const query = parseProductSearchParams(params);
  expect(query.crafts).toEqual(["SAGI"]);
  expect(query.materials).toEqual(["WOOD"]);
  const request = toProductListSearchParams(query);
  expect(request.has("subcategory")).toBe(false);
  expect(request.has("material")).toBe(false);
  expect(productKeys.list(query)).not.toEqual(
    productKeys.list({ ...query, crafts: [], materials: [] }),
  );
  expect(
    updateProductSearchParams(params, { page: 3 }).getAll("subcategory"),
  ).toEqual(["SAGI"]);
  const changed = updateProductSearchParams(params, {
    crafts: ["YUGI"],
    materials: ["CLAY"],
  });
  expect(changed.getAll("subcategory")).toEqual(["YUGI"]);
  expect(changed.getAll("material")).toEqual(["CLAY"]);
  expect(
    getProductSeo({
      category: "다기-찻잔",
      subcategory: "SAGI",
      material: "WOOD",
    }).hasFilters,
  ).toBe(true);
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
  expect(screen.queryByRole("button", { name: "소재" })).toBeVisible();
  expect(screen.getByRole("button", { name: "가격대" })).toBeVisible();
});

it("소분류가 아닌 소재는 빈 목록이고 공예 종목은 차단한다", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  expect(await fetchProductMaterials("category-1")).toEqual([]);
  expect(fetchSpy).not.toHaveBeenCalled();
  await expect(fetchProductCrafts("category-1")).rejects.toThrow();
  expect(fetchSpy).not.toHaveBeenCalled();
});
