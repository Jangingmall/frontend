import { clientFetch, clientFetchExists } from "@/lib/http/client";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { mapWishlistPage } from "./mapper";
import { wishlistPageDto } from "./validation";

const PAGE_SIZE = 20;

/** `GET /api/member/me/wishes` — 실제 BE 계약 그대로(Spring Page, `page`는 0-base). */
export async function fetchWishlist(
  page: number,
): Promise<Page<ProductSummary>> {
  const search = new URLSearchParams({
    page: String(page - 1),
    size: String(PAGE_SIZE),
  });
  const data = await clientFetch<unknown>(`/api/member/me/wishes?${search}`);
  return mapWishlistPage(wishlistPageDto.parse(data));
}

/**
 * 찜한 상품 id 전체를 모은다 — 최근 본 상품 화면처럼 여러 상품의 찜 여부를 한 번에
 * 확인해야 할 때, 상품마다 `checkWished`를 부르는 대신 이걸 한 번(보통 1페이지) 부른다.
 */
export async function fetchWishedIds(): Promise<Set<number>> {
  const ids = new Set<number>();
  let page = 1;
  let totalPages = 1;
  do {
    const result = await fetchWishlist(page);
    result.items.forEach((item) => ids.add(item.id));
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return ids;
}

/**
 * `POST|DELETE /api/products/{id}/wish` — 실제 계약 그대로, 목업 여부로 분기하지 않는다
 * (`api/products/detail-actions.ts`의 기존 `setProductWishlist`와 달리 항상 이 경로만
 * 호출 — mock 여부는 MSW가 이 경로를 가로채는지로만 갈린다).
 */
export async function addWish(productId: number): Promise<void> {
  await clientFetch(`/api/products/${productId}/wish`, { method: "POST" });
}

export async function removeWish(productId: number): Promise<void> {
  await clientFetch(`/api/products/${productId}/wish`, { method: "DELETE" });
}

/**
 * `GET /api/member/me/wishes/{productId}` — 공통 응답 봉투를 안 쓰는 예외 엔드포인트
 * (204/404만, `docs/api-contract.md` §5). 상품 하나의 찜 여부만 필요할 때 쓴다.
 */
export async function checkWished(productId: number): Promise<boolean> {
  return clientFetchExists(`/api/member/me/wishes/${productId}`);
}
