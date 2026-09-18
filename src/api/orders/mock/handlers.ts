import dayjs from "dayjs";
import { http } from "msw";

import {
  ORDER_STATUS_GROUP,
  type OrderStatusGroupKey,
} from "@/constants/order";
import { mockOk, mockPaged } from "@/mocks/envelope";

import { orderFixtures } from "./fixtures";

/**
 * 마이페이지 주문 목록 도메인 MSW 핸들러. (design.md §5 — BE에 아직 없는 목업 계약)
 * `src/mocks/handlers.ts`에 등록된다.
 */
export const orderHandlers = [
  http.get("*/api/member/me/orders/summary", () => {
    // "최근 3개월 기준" 고정 윈도우 — 목록 필터 상태와 무관(design.md §5.2).
    const since = dayjs().subtract(3, "month");
    const items = orderFixtures
      .filter((order) => dayjs(order.orderedAt).isAfter(since))
      .flatMap((order) => order.items);

    // 주문 전체가 아니라 아이템 단위로 센다 — 목업 모델이 아이템별 상태를 갖고 있어서다
    // (order-level 상태 하나만 있는 실제 BE와의 간극은 design.md §5.3 참고).
    const count = (keys: readonly string[]) =>
      items.filter((item) => (keys as string[]).includes(item.status)).length;

    return mockOk({
      paymentPending: count(ORDER_STATUS_GROUP.PAYMENT_PENDING),
      preparing: count(ORDER_STATUS_GROUP.PREPARING),
      shipping: count(ORDER_STATUS_GROUP.SHIPPING),
      delivered: count(ORDER_STATUS_GROUP.DELIVERED),
      exchangeRefund: count(ORDER_STATUS_GROUP.EXCHANGE_REFUND),
      canceled: count(ORDER_STATUS_GROUP.CANCELED),
    });
  }),

  http.get("*/api/member/me/orders", ({ request }) => {
    const url = new URL(request.url);
    const params = url.searchParams;
    const page = Number(params.get("page") ?? "1");
    const size = Math.min(100, Math.max(1, Number(params.get("size")) || 10));
    const from = params.get("from");
    const to = params.get("to");
    const status = params.get("status") as OrderStatusGroupKey | null;
    const artisanName = params.get("artisanName");
    const statusValues = status ? ORDER_STATUS_GROUP[status] : null;

    const filtered = orderFixtures.filter((order) => {
      if (from && dayjs(order.orderedAt).isBefore(dayjs(from), "day"))
        return false;
      if (to && dayjs(order.orderedAt).isAfter(dayjs(to), "day")) return false;
      if (
        statusValues &&
        !order.items.some((item) =>
          (statusValues as string[]).includes(item.status),
        )
      )
        return false;
      if (
        artisanName &&
        !order.items.some((item) => item.artisanName.includes(artisanName))
      )
        return false;
      return true;
    });

    const offset = (Math.max(1, page || 1) - 1) * size;
    return mockPaged(filtered.slice(offset, offset + size), filtered.length);
  }),
];
