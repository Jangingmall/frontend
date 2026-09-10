import { http } from "msw";

import { mockOk } from "@/mocks/envelope";

import { productListEmpty, productListPage1 } from "./fixtures";

/**
 * 상품 도메인 MSW 핸들러. `src/mocks/handlers.ts`에 등록된다.
 * 지금은 레퍼런스로 목록 1개만 — 필터·정렬·상세 stub은 상품 도메인 계약 작업에서 추가.
 */
export const productHandlers = [
  http.get("*/api/products", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    // page 2 이상은 비운다 — 페이지네이션 경계 확인용.
    return mockOk(page > 1 ? productListEmpty : productListPage1);
  }),
];
