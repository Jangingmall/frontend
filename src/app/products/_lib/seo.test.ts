import { expect, it } from "vitest";

import { getProductSeo } from "./seo";

it.each([
  { page: "2" },
  { sort: "popular" },
  { excludeSoldOut: "false" },
  { utm_source: "demo" },
])("기본값과 페이지는 필터로 색인 제한하지 않는다: %j", (params) => {
  expect(getProductSeo({ category: "kitchen", ...params })).toEqual({
    canonical: "/products?category=kitchen",
    hasFilters: false,
  });
});

it.each([
  { material: ["wood", "metal"] },
  { sort: "price-asc" },
  { minPrice: "1000" },
  { hasGiftWrap: "true" },
])("실제 조회 조건은 색인 제한한다: %j", (params) => {
  expect(getProductSeo({ category: "kitchen", ...params }).hasFilters).toBe(
    true,
  );
});
