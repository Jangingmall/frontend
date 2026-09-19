import dayjs from "dayjs";
import { http } from "msw";

import { mockOk } from "@/mocks/envelope";

import { orderFixtures } from "./fixtures";

/**
 * 마이페이지 주문 목록 도메인 MSW 핸들러. (`장인몰 주문 이력 API 계약서` v1.0 확정 —
 * Spring `Pageable` 응답 그대로 재현) `src/mocks/handlers.ts`에 등록된다.
 */
export const orderHandlers = [
  http.get("*/api/member/me/orders/summary", () => {
    // "최근 3개월 기준" 고정 윈도우 — 목록 필터 상태와 무관(계약서 §3-3).
    // 상태는 주문 전체에 하나뿐이라(아이템별 아님) 주문 단위로 센다.
    const since = dayjs().subtract(3, "month");
    const recent = orderFixtures.filter((order) =>
      dayjs(order.createdAt).isAfter(since),
    );
    const count = (status: string) =>
      recent.filter((order) => order.status === status).length;

    return mockOk({
      inProgress: {
        awaitingPayment: count("CREATED"),
        preparing: count("PAID"),
        inDelivery: count("IN_DELIVERY"),
        delivered: count("DELIVERED"),
      },
      closedCount: {
        returnOrExchange: count("RETURN_REQUESTED"),
        canceled: count("CANCELED"),
      },
    });
  }),

  http.get("*/api/member/me/orders", ({ request }) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    // BE 0-base → 목업 내부에서도 0-base로 그대로 다룬다(계약서 §3-1).
    const page = Math.max(0, Number(params.get("page") ?? "0") || 0);
    const size = Math.min(100, Math.max(1, Number(params.get("size")) || 20));
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status");
    const artisanName = params.get("artisanName");

    const filtered = orderFixtures.filter((order) => {
      // 결제 실패 주문은 마이페이지 목록에 노출하지 않기로 확정(design.md §10.3) — 페이지네이션
      // 계산 전에 걸러낸다. `mapper.ts`가 이 값을 다시 걸러내는 건 실제 BE가 이 규칙을 안
      // 지켰을 때를 대비한 방어적 안전망일 뿐, 정상 경로에서 페이지 메타데이터와 화면에 보이는
      // 목록의 모집합이 어긋나면 안 된다(Codex 리뷰 F1 — 제외 주문만 든 페이지가 빈 목록으로
      // 보이고 페이지네이션까지 숨는 문제).
      if (order.status === "PAYMENT_FAILED") return false;
      if (from && dayjs(order.createdAt).isBefore(dayjs(from), "day"))
        return false;
      if (to && dayjs(order.createdAt).isAfter(dayjs(to), "day")) return false;
      if (status && status !== "ALL" && order.status !== status) return false;
      if (
        artisanName &&
        !order.items.some((item) => item.artisanName.includes(artisanName))
      )
        return false;
      return true;
    });

    const offset = page * size;
    const content = filtered.slice(offset, offset + size);
    // 실제 Spring `PageImpl.getTotalPages()`는 결과가 0건이면 0을 반환한다(하한을 1로
    // 두지 않는다) — 목업도 그 계산을 그대로 흉내낸다(Codex 리뷰).
    const totalPages = Math.ceil(filtered.length / size);

    return mockOk({
      content,
      totalElements: filtered.length,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: content.length === 0,
    });
  }),
];
