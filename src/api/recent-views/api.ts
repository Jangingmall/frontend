import { clientFetch } from "@/lib/http/client";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { mapRecentViewPage } from "./mapper";
import { recentViewPageDto } from "./validation";

const PAGE_SIZE = 20;

/** `GET /api/member/recent-views` — 실제 BE 계약 그대로(Spring Page, `page`는 0-base). */
export async function fetchRecentViews(
  page: number,
): Promise<Page<ProductSummary>> {
  const search = new URLSearchParams({
    page: String(page - 1),
    size: String(PAGE_SIZE),
  });
  const data = await clientFetch<unknown>(`/api/member/recent-views?${search}`);
  return mapRecentViewPage(recentViewPageDto.parse(data));
}

/**
 * `DELETE /api/member/recent-views` — 전체 삭제(개별 삭제 API는 없음). 만들어두되 v1
 * 화면엔 아직 연결하지 않는다(Figma에 전체 삭제 버튼이 안 보임).
 */
export async function clearRecentViews(): Promise<void> {
  await clientFetch("/api/member/recent-views", { method: "DELETE" });
}
