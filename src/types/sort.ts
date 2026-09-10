/**
 * 상품 목록 정렬. (docs/routing-and-auth.md §3 · docs/api-contract.md §5)
 * URL 표현 ↔ API enum 매핑은 API 계층이 소유한다. URL·화면·쿼리가 함께 쓰므로 공유 타입.
 */

export type ProductListSort =
  "popular" | "newest" | "wishlist" | "sales" | "price-asc" | "price-desc";

export type ProductListSortApi =
  | "POPULAR"
  | "NEWEST"
  | "WISHLIST_COUNT"
  | "SALES_COUNT"
  | "PRICE_ASC"
  | "PRICE_DESC";

export const PRODUCT_LIST_SORT: Record<ProductListSort, ProductListSortApi> = {
  popular: "POPULAR",
  newest: "NEWEST",
  wishlist: "WISHLIST_COUNT",
  sales: "SALES_COUNT",
  "price-asc": "PRICE_ASC",
  "price-desc": "PRICE_DESC",
};

export const DEFAULT_PRODUCT_LIST_SORT: ProductListSort = "popular";

/** URL 표현 → API enum. 모르는 값은 기본 정렬로 폴백한다. */
export function toProductListSortApi(
  sort: string | null | undefined,
): ProductListSortApi {
  if (sort && sort in PRODUCT_LIST_SORT) {
    return PRODUCT_LIST_SORT[sort as ProductListSort];
  }
  return PRODUCT_LIST_SORT[DEFAULT_PRODUCT_LIST_SORT];
}
