import { isMockProductQuery } from "@/lib/data-mode";
import { publicEnv } from "@/lib/env";
import { toGiftThemeApi } from "@/types/gift-theme";
import type { ProductCategory } from "@/types/product-filter";
import { toProductListSortApi } from "@/types/sort";

import { toDemoProductQuery } from "./demo-query";
import { mapProductListPage } from "./mapper";
import { type ProductListQuery, resolveProductListPaging } from "./query";
import { productListResponseDto } from "./validation";

/** 기존 실제 API 함수의 요청 형식은 유지하고, 미지원 필터를 선택한 경우에만 사용한다. */
export function usesDemoCatalogue(query: ProductListQuery) {
  return !publicEnv.apiMocking && isMockProductQuery("api", query);
}
export function toDemoCatalogueParams(query: ProductListQuery) {
  const { page, size } = resolveProductListPaging(query);
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: toProductListSortApi(query.sort),
  });
  for (const key of ["category", "keyword", "minPrice", "maxPrice"] as const) {
    if (query[key] !== undefined) params.set(key, String(query[key]));
  }
  for (const [key, values] of [
    ["subcategory", query.crafts],
    ["material", query.materials],
  ] as const) {
    for (const value of [...new Set(values)].filter(Boolean).sort())
      params.append(key, value);
  }
  if (query.giftTheme) params.set("giftTheme", toGiftThemeApi(query.giftTheme));
  if (query.hasGiftWrap) params.set("hasGiftWrap", "true");
  params.set("excludeSoldOut", String(query.excludeSoldOut ?? false));
  return params;
}
export async function fetchDemoProductList(
  query: ProductListQuery,
  categories: ProductCategory[],
  read: (path: string) => Promise<unknown>,
) {
  const demoQuery = toDemoProductQuery(query, categories);
  const page = mapProductListPage(
    productListResponseDto.parse(
      await read(
        `/api/mock/catalogue/products?${toDemoCatalogueParams(demoQuery)}`,
      ),
    ),
    resolveProductListPaging(query),
  );
  return {
    ...page,
    items: page.items.map((item) => ({ ...item, isDemo: true })),
  };
}
