import { publicEnv } from "@/lib/env";
import { fetchPublicApi } from "@/lib/http/fetcher";
import { isrTags } from "@/lib/isr/tags";

import { fetchBackendProductList } from "./backend-list";
import { mapBackendProductCategories } from "./backend-mapper";
import { productCategoriesDto } from "./filter-validation";
import { mapProductCategories, mapProductListPage } from "./mapper";
import {
  type ProductListQuery,
  resolveProductListPaging,
  toProductListSearchParams,
} from "./query";
import { productListResponseDto } from "./validation";
const read = (path: string) =>
  fetchPublicApi<unknown>(path, {
    tags: [isrTags.productList()],
    revalidate: 3600,
  });
export async function fetchProductCategoriesServer() {
  const dto = await read("/api/products/categories");
  return publicEnv.apiMocking
    ? mapProductCategories(productCategoriesDto.parse(dto))
    : mapBackendProductCategories(
        dto,
        await read("/api/products/subcategories"),
      );
}
export async function fetchProductList(query: ProductListQuery = {}) {
  if (!publicEnv.apiMocking)
    return fetchBackendProductList(query, read, fetchProductCategoriesServer);
  return mapProductListPage(
    productListResponseDto.parse(
      await read(`/api/products?${toProductListSearchParams(query)}`),
    ),
    resolveProductListPaging(query),
  );
}
