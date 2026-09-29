import { publicEnv } from "@/lib/env";
import { fetchPublicApi } from "@/lib/http/fetcher";
import { isrTags } from "@/lib/isr/tags";

import { fetchBackendProductList } from "./backend-list";
import { mapBackendProductCategories } from "./backend-mapper";
import { mapProductListPage } from "./mapper";
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
// 분류는 트리거 이벤트 없이 time-based로만 갱신된다(docs/isr.md §2 `product-taxonomy`).
const readTaxonomy = (path: string) =>
  fetchPublicApi<unknown>(path, {
    tags: [isrTags.productTaxonomy()],
    revalidate: 86400,
  });
export async function fetchProductCategoriesServer() {
  return mapBackendProductCategories(
    await readTaxonomy("/api/products/categories"),
    await readTaxonomy("/api/products/subcategories"),
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
