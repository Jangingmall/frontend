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
    const totalPages = Math.max(1, Math.ceil(filtered.length / size));

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
