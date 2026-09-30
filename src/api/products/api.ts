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
// 루트 layout이 이 조회를 기다린다 — 백엔드가 응답하지 않아도 모든 화면 렌더가 오래 멈추지 않도록
// 짧은 타임아웃을 둔다(실패는 호출부가 삼키고 클라이언트가 다시 조회한다).
const readTaxonomy = (path: string) =>
  fetchPublicApi<unknown>(path, {
    tags: [isrTags.productTaxonomy()],
    revalidate: 86400,
    signal: AbortSignal.timeout(3000),
  });
export async function fetchProductCategoriesServer() {
  // 두 응답은 서로 독립이라 병렬로 받는다 — 직렬이면 타임아웃이 두 번 겹쳐 루트 layout이 최대
  // 6초까지 멈출 수 있다.
  const [categories, subcategories] = await Promise.all([
    readTaxonomy("/api/products/categories"),
    readTaxonomy("/api/products/subcategories"),
  ]);
  return mapBackendProductCategories(categories, subcategories);
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
