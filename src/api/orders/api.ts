import type { OrderStatusGroupKey, ReturnReason } from "@/constants/order";
import { clientFetch } from "@/lib/http/client";
import type { Page } from "@/types/api";
import type {
  OrderDelivery,
  OrderDetail,
  OrderGroup,
  OrderStatusSummary,
} from "@/types/order";

import {
  mapOrderDelivery,
  mapOrderDetail,
  mapOrderListPage,
  mapOrderStatusSummary,
} from "./mapper";
import {
  type OrdersListQuery,
  resolveOrdersListPaging,
  toOrdersListSearchParams,
} from "./query";
import {
  orderDeliveryResponseDto,
  orderDetailResponseDto,
  orderListResponseDto,
  orderStatusSummaryDto,
} from "./validation";

/**
 * 마이페이지 주문 목록 도메인 API 함수. (`장인몰 주문 이력 API 계약서` v1.0 확정 —
 * 인증 데이터라 ISR 제외 · `clientFetch`로 Bearer 주입)
 */

/** `GET /api/member/me/orders` → 페이지네이션된 주문 목록. */
export async function fetchOrdersList(
  query: OrdersListQuery = {},
): Promise<Page<OrderGroup>> {
  const data = await clientFetch<unknown>(
    `/api/member/me/orders?${toOrdersListSearchParams(query)}`,
  );
  return mapOrderListPage(orderListResponseDto.parse(data));
}

/** MY-2("전체" 탭)가 합쳐 보여줘야 하는 두 상태 그룹. `fetchCancellationOrdersList` 참고. */
const CANCELLATION_STATUS_GROUPS: readonly OrderStatusGroupKey[] = [
  "EXCHANGE_REFUND",
  "CANCELED",
];

/**
 * 한 상태 그룹의 전체 페이지를 모아 온다(`fetchCancellationOrdersList` 전용). 첫 페이지로
 * `totalPages`를 알아낸 뒤 나머지 페이지를 병렬로 마저 가져온다 — 취소·교환·환불 누적
 * 건수는 현실적으로 수십 건 수준이라 페이지 수가 적다.
 */
async function fetchAllOrdersByStatus(
  status: OrderStatusGroupKey,
  query: OrdersListQuery,
): Promise<{ items: OrderGroup[]; totalCount: number }> {
  const pageSize = 100;
  const first = await fetchOrdersList({
    ...query,
    status,
    page: 1,
    size: pageSize,
  });
  if (first.totalPages <= 1) {
    return { items: first.items, totalCount: first.totalCount };
  }
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) =>
      fetchOrdersList({ ...query, status, page: i + 2, size: pageSize }),
    ),
  );
  return {
    items: [...first.items, ...rest.flatMap((p) => p.items)],
    totalCount: first.totalCount,
  };
}

/**
 * 취소·교환·환불 내역(Figma MY-2) "전체" 탭 전용 목록 조회. BE `status` 쿼리 파라미터는
 * 값 하나만 받아(`MemberReadRepositoryImpl.orders` — `ALL` 아니면 단일 `o.status=:status`
 * 동등비교) "교환·환불 + 주문취소를 합친 전체"를 한 번에 요청할 방법이 없다(`be-requests.md`
 * 참고) — 두 상태 각각의 전체 페이지를 가져와(`fetchAllOrdersByStatus`) 주문일 내림차순으로
 * 합친 뒤 요청한 페이지 구간만 잘라낸다. 개별 탭(교환·환불/주문취소)은 이미 단일 raw
 * status라 `fetchOrdersList`로 그대로 위임한다.
 */
export async function fetchCancellationOrdersList(
  query: OrdersListQuery = {},
): Promise<Page<OrderGroup>> {
  if (query.status && query.status !== "ALL") {
    return fetchOrdersList(query);
  }
  const { page, size } = resolveOrdersListPaging(query);
  const results = await Promise.all(
    CANCELLATION_STATUS_GROUPS.map((status) =>
      fetchAllOrdersByStatus(status, query),
    ),
  );
  const merged = results
    .flatMap((r) => r.items)
    .sort((a, b) => (a.orderedAt < b.orderedAt ? 1 : -1));
  const totalCount = results.reduce((sum, r) => sum + r.totalCount, 0);
  return {
    items: merged.slice((page - 1) * size, page * size),
    page,
    pageSize: size,
    totalCount,
    totalPages: Math.ceil(totalCount / size),
  };
}

/** `GET /api/member/me/orders/summary` → 최근 3개월 고정 기준 상태별 카운트. */
export async function fetchOrderStatusSummary(): Promise<OrderStatusSummary> {
  const data = await clientFetch<unknown>("/api/member/me/orders/summary");
  return mapOrderStatusSummary(orderStatusSummaryDto.parse(data));
}

/** `GET /api/member/me/orders/{orderId}` → 주문 상세. 본인 주문이 아니거나 없으면 404. */
export async function fetchOrderDetail(orderId: number): Promise<OrderDetail> {
  const data = await clientFetch<unknown>(`/api/member/me/orders/${orderId}`);
  return mapOrderDetail(orderDetailResponseDto.parse(data));
}

/** `GET /api/payments/orders/{orderId}/delivery` → 배송 조회(택배사·운송장번호·3단계 상태). */
export async function fetchOrderDelivery(
  orderId: number,
): Promise<OrderDelivery> {
  const data = await clientFetch<unknown>(
    `/api/payments/orders/${orderId}/delivery`,
  );
  return mapOrderDelivery(orderDeliveryResponseDto.parse(data));
}

/**
 * 주문 취소 요청(사유·사진 첨부) — 목업 전용 엔드포인트. 결제 전 주문을 취소하는 실제 API가
 * BE에 없다(`be-requests.md` #6) — 답변 전까지 화면 흐름만 보여준다. `imageIds`는 실제로
 * 업로드는 됐지만(§`api/images`) 받는 쪽이 목업이라 그냥 저장 안 되고 버려진다.
 */
export async function requestOrderCancel(
  orderId: number,
  input: { reason: string; imageIds: string[] },
): Promise<void> {
  await clientFetch<null>(`/api/payments/orders/${orderId}/cancel-request`, {
    method: "POST",
    body: input,
  });
}

/**
 * 교환·환불 신청 — 실제 BE 계약 그대로(`ReturnController`/`ReturnService.request`,
 * `docs/api-contract.md` §8). `NEXT_PUBLIC_API_MOCKING`을 끄면 이 호출이 바로 실제 서버로
 * 간다. `returnAddressId`는 생략 — BE가 주문 자체의 배송지를 기본값으로 쓴다.
 */
export async function requestOrderExchangeRefund(
  orderId: number,
  input: {
    type: "EXCHANGE" | "RETURN";
    orderItemId: number;
    reason: ReturnReason;
    description?: string;
    imageIds: string[];
  },
): Promise<void> {
  await clientFetch<null>("/api/payments/returns", {
    method: "POST",
    body: {
      orderId,
      type: input.type,
      orderItemIds: [input.orderItemId],
      reason: input.reason,
      description: input.description,
      imageIds: input.imageIds,
    },
  });
}

/**
 * 구매 확정(배송 완료 상태 전용) — 목업 전용 엔드포인트. "구매 확정" 개념·상태값 자체가
 * BE에 없다(`be-requests.md` #6).
 */
export async function confirmPurchase(orderId: number): Promise<void> {
  await clientFetch<null>(`/api/member/me/orders/${orderId}/confirm-purchase`, {
    method: "POST",
  });
}

export interface ChangeOrderAddressRequest {
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
}

/**
 * 주문 배송지 변경(입금 확인 중·상품 준비 중 상태 전용) — 목업 전용 엔드포인트. 회원 배송지
 * 목록 CRUD와 별개로 이 주문 1건의 배송지만 바꾸는 API가 BE에 없다(`be-requests.md` #7).
 */
export async function changeOrderAddress(
  orderId: number,
  input: ChangeOrderAddressRequest,
): Promise<void> {
  await clientFetch<null>(`/api/payments/orders/${orderId}/address`, {
    method: "PATCH",
    body: input,
  });
}
