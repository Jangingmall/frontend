import { z } from "zod";

import { createAddress, fetchAddresses } from "@/api/member/api";
import type { OrderStatusGroupKey, ReturnReason } from "@/constants/order";
import { publicEnv } from "@/lib/env";
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

/** 실제 취소는 CREATED 주문 전체에 적용되며 사유·사진을 받지 않는다. */
export async function requestOrderCancel(
  orderId: number,
  input: { reason: string; imageIds: string[] },
): Promise<void> {
  if (!publicEnv.apiMocking) {
    const data = await clientFetch(`/api/payments/orders/${orderId}/cancel`, {
      method: "POST",
    });
    z.object({
      orderId: z.literal(orderId),
      status: z.literal("CANCELED"),
    }).parse(data);
    return;
  }
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

/** 배송 완료 주문의 구매 확정. */
export async function confirmPurchase(orderId: number): Promise<void> {
  if (!publicEnv.apiMocking) {
    const data = await clientFetch(
      `/api/payments/orders/${orderId}/purchase-confirmation`,
      { method: "POST" },
    );
    z.object({
      orderId: z.literal(orderId),
      status: z.literal("PURCHASE_CONFIRMED"),
    }).parse(data);
    return;
  }
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

/** 기존 주소를 재사용하거나 생성한 뒤 주문의 배송지 스냅샷만 변경한다. */
export async function changeOrderAddress(
  orderId: number,
  input: ChangeOrderAddressRequest,
): Promise<void> {
  if (!publicEnv.apiMocking) {
    const addresses = await fetchAddresses();
    const existing = addresses.find(
      (address) =>
        address.recipientName === input.recipientName &&
        address.phone === input.phone &&
        address.zipCode === input.zipCode &&
        address.address1 === input.address1 &&
        address.address2 === input.address2,
    );
    const address =
      existing ?? (await createAddress({ ...input, isDefault: false }));
    const data = await clientFetch(
      `/api/payments/orders/${orderId}/shipping-address`,
      {
        method: "PATCH",
        body: { addressId: address.id },
      },
    );
    z.object({
      orderId: z.literal(orderId),
      addressId: z.literal(address.id),
    }).parse(data);
    return;
  }
  await clientFetch<null>(`/api/payments/orders/${orderId}/address`, {
    method: "PATCH",
    body: input,
  });
}
