import { isMockProductQuery } from "@/lib/data-mode";
import { publicEnv } from "@/lib/env";
import { fetchPublicApi } from "@/lib/http/fetcher";
import { isrTags } from "@/lib/isr/tags";

import { fetchBackendProductList } from "./backend-list";
import { mapBackendProductCategories } from "./backend-mapper";
import { toDemoProductQuery } from "./demo-query";
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
  if (!isMockProductQuery(publicEnv.apiMocking ? "msw" : "api", query))
    return fetchBackendProductList(query, read, fetchProductCategoriesServer);
  const demoQuery = publicEnv.apiMocking
    ? query
    : toDemoProductQuery(
        query,
        query.category ? await fetchProductCategoriesServer() : [],
      );
  return mapProductListPage(
    productListResponseDto.parse(
      await read(
        `${publicEnv.apiMocking ? "/api" : "/api/mock/catalogue"}/products?${toProductListSearchParams(demoQuery)}`,
      ),
    ),
    resolveProductListPaging(query),
  );
}
