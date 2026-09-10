import { http, HttpResponse } from "msw";

import { productListEmpty, productListPage1 } from "./fixtures";

/**
 * 상품 도메인 MSW 핸들러. `src/mocks/handlers.ts`에 등록하는 것과 응답 봉투·시드 유틸
 * 정리는 목업 기반 작업에서 한다. 지금은 레퍼런스로 목록 1개만.
 */

/** 공통 성공 봉투. (docs/api-contract.md §2.1) 봉투 헬퍼가 생기면 그걸로 대체한다. */
function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, status, data }, { status });
}

export const productHandlers = [
  http.get("*/api/products", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    // page 2 이상은 비운다 — 페이지네이션 경계 확인용.
    return ok(page > 1 ? productListEmpty : productListPage1);
  }),
];
