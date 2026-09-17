import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

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

it("연동 설정을 켜면 URL·UI·서버 요청·캐시·SEO가 같은 종목 선택을 사용한다", () => {
  const params = new URLSearchParams(
    "category=다기-찻잔&subcategory=SAGI&subcategory=YUGI&page=2",
  );
  const query = parseProductSearchParams(params);
  expect(query.crafts).toEqual(["SAGI", "YUGI"]);
  expect(toProductListSearchParams(query).getAll("subcategory")).toEqual([
    "SAGI",
    "YUGI",
  ]);
  expect(productKeys.list(query)).not.toEqual(
    productKeys.list({ ...query, crafts: [] }),
  );
  expect(
    updateProductSearchParams(params, { page: 3 }).getAll("subcategory"),
  ).toEqual(["SAGI", "YUGI"]);
  expect(
    updateProductSearchParams(params, { crafts: [] }).has("subcategory"),
  ).toBe(false);
  expect(
    getProductSeo({ category: "다기-찻잔", subcategory: "SAGI" }).hasFilters,
  ).toBe(true);
  render(
    <ProductFilters
      query={query}
      category={{
        id: "다기-찻잔",
        name: "다기 · 찻잔",
        parentId: "키친-다이닝",
        description: "",
        minPrice: 1000,
        maxPrice: 9990000,
      }}
      categories={[]}
      materials={[]}
      crafts={[
        { id: "SAGI", name: "사기장" },
        { id: "YUGI", name: "유기장" },
      ]}
      onChange={vi.fn()}
      onReset={vi.fn()}
    />,
  );
  expect(screen.getByRole("button", { name: "사기장" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "유기장" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
