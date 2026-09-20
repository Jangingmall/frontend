import {
  type OrdersListQuery,
  toOrdersListSearchParams,
} from "@/api/orders/query";

export const orderKeys = {
  all: ["orders"] as const,
  list: (query: OrdersListQuery) =>
    ["orders", "list", toOrdersListSearchParams(query).toString()] as const,
  /** MY-2 전용(`fetchCancellationOrdersList`) — `list`와 검색 파라미터가 같아 보여도
   * 병합 조회 결과라 캐시를 분리해야 한다. */
  cancellationList: (query: OrdersListQuery) =>
    [
      "orders",
      "cancellation-list",
      toOrdersListSearchParams(query).toString(),
    ] as const,
  statusSummary: ["orders", "status-summary"] as const,
  detail: (orderId: number) => ["orders", "detail", orderId] as const,
  delivery: (orderId: number) => ["orders", "delivery", orderId] as const,
};
