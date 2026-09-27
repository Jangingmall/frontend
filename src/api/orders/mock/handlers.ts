import dayjs from "dayjs";
import { type DefaultBodyType, http, type PathParams } from "msw";

import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import { orderDetailFixtures, orderFixtures } from "./fixtures";

/** 성공·실패 응답을 함께 반환하는 핸들러에 명시 지정 — 아니면 TS가 첫 반환 분기만 보고
 * 응답 타입을 좁혀 다른 분기(주로 `mockError`)에서 타입 에러가 난다(`api/member` 동일 패턴). */
type Envelope = ApiResponse<unknown> | ApiErrorResponse;

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

  /** `GET /api/member/me/orders/{orderId}` — 주문 상세(T-28). */
  http.get<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/me/orders/:orderId",
    ({ params }) => {
      const orderId = Number(params.orderId);
      const detail = orderDetailFixtures.get(orderId);
      if (!detail) return mockError(404, "NOT_FOUND");

      const productAmount = detail.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      return mockOk({
        orderId: detail.orderId,
        orderNumber: detail.orderNumber,
        status: detail.status,
        totalAmount: productAmount + detail.shippingAmount,
        createdAt: detail.createdAt,
        returnInfo: detail.returnInfo,
        cancelReason: detail.cancelReason,
        canceledBy: detail.canceledBy,
        items: detail.items,
        address: detail.address,
        shippingAmount: detail.shippingAmount,
        paymentMethod: detail.paymentMethod,
        discountAmount: detail.discountAmount,
        pointsUsed: detail.pointsUsed,
        purchaseConfirmed: detail.purchaseConfirmed,
      });
    },
  ),

  /** `GET /api/payments/orders/{orderId}/delivery` — 배송 조회(T-28, `be-requests.md` #5). */
  http.get<PathParams, DefaultBodyType, Envelope>(
    "*/api/payments/orders/:orderId/delivery",
    ({ params }) => {
      const orderId = Number(params.orderId);
      const detail = orderDetailFixtures.get(orderId);
      if (!detail) return mockError(404, "NOT_FOUND");

      const status =
        detail.status === "DELIVERED"
          ? "DELIVERED"
          : detail.status === "IN_DELIVERY"
            ? "IN_TRANSIT"
            : "SHIPPED";
      return mockOk({
        orderId,
        carrier: "CJ대한통운",
        trackingNumber: `${600000000000 + orderId}`,
        status,
      });
    },
  ),

  /**
   * `POST /api/payments/orders/{orderId}/cancel-request` — 목업 전용 경로(대응 BE 엔드포인트
   * 없음, `be-requests.md` #6). 사유·사진(imageId만, 실제 저장은 안 함)을 받아 즉시 승인
   * 처리한다 — 승인 대기 흐름은 정책 미확정이라 로드맵 원칙대로 전부 허용한다.
   */
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/payments/orders/:orderId/cancel-request",
    async ({ params, request }) => {
      const orderId = Number(params.orderId);
      const detail = orderDetailFixtures.get(orderId);
      if (!detail) return mockError(404, "NOT_FOUND");
      const body = (await request.json()) as { reason?: string };
      detail.status = "CANCELED";
      detail.cancelReason = body.reason;
      detail.canceledBy = "CONSUMER";
      const listOrder = orderFixtures.find(
        (order) => order.orderId === orderId,
      );
      if (listOrder) {
        listOrder.status = "CANCELED";
        listOrder.cancelReason = body.reason;
        listOrder.canceledBy = "CONSUMER";
      }
      return mockOk(null);
    },
  ),

  /**
   * `POST /api/payments/returns` — 실제 BE 경로 그대로(`ReturnController`/`ReturnService`,
   * `docs/api-contract.md` §8). 승인 대기 흐름·상태 전이 제한(BE는 `PAID`/`DELIVERED`만
   * 허용)은 목업에서 걸지 않는다 — 로드맵 원칙대로 전부 허용, 정책 확정 시 별도 반영.
   */
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/payments/returns",
    async ({ request }) => {
      const body = (await request.json()) as {
        orderId: number;
        type: "EXCHANGE" | "RETURN";
        reason: string;
        description?: string;
      };
      const orderId = Number(body.orderId);
      const detail = orderDetailFixtures.get(orderId);
      if (!detail) return mockError(404, "NOT_FOUND");

      const returnInfo = {
        type: body.type,
        status: "REQUESTED" as const,
        reason: body.description ?? body.reason,
      };
      detail.status = "RETURN_REQUESTED";
      detail.returnInfo = returnInfo;
      const listOrder = orderFixtures.find(
        (order) => order.orderId === orderId,
      );
      if (listOrder) {
        listOrder.status = "RETURN_REQUESTED";
        listOrder.returnInfo = returnInfo;
      }

      return mockOk({
        returnId: Math.floor(Math.random() * 1_000_000),
        orderId,
        type: body.type,
        status: "REQUESTED",
        requestedAt: new Date().toISOString(),
      });
    },
  ),

  /**
   * `POST /api/member/me/orders/{orderId}/confirm-purchase` — 목업 전용(T-28,
   * `be-requests.md` #6).
   */
  http.post<PathParams, DefaultBodyType, Envelope>(
    "*/api/member/me/orders/:orderId/confirm-purchase",
    ({ params }) => {
      const orderId = Number(params.orderId);
      const detail = orderDetailFixtures.get(orderId);
      if (!detail) return mockError(404, "NOT_FOUND");
      if (detail.status !== "DELIVERED") {
        return mockError(
          422,
          "BUSINESS_RULE_VIOLATION",
          "배송 완료된 주문만 구매 확정할 수 있습니다.",
        );
      }
      detail.purchaseConfirmed = true;
      detail.status = "PURCHASE_CONFIRMED";
      const order = orderFixtures.find((item) => item.orderId === orderId);
      if (order) order.status = "PURCHASE_CONFIRMED";
      return mockOk(null);
    },
  ),

  /** `PATCH /api/payments/orders/{orderId}/address` — 목업 전용(T-28, `be-requests.md` #7). */
  http.patch<PathParams, DefaultBodyType, Envelope>(
    "*/api/payments/orders/:orderId/address",
    async ({ params, request }) => {
      const orderId = Number(params.orderId);
      const detail = orderDetailFixtures.get(orderId);
      if (!detail) return mockError(404, "NOT_FOUND");
      if (detail.status !== "CREATED" && detail.status !== "PAID") {
        return mockError(
          422,
          "BUSINESS_RULE_VIOLATION",
          "배송지를 변경할 수 없는 주문 상태입니다.",
        );
      }
      const body = (await request.json()) as Partial<typeof detail.address>;
      detail.address = { ...detail.address, ...body };
      return mockOk(null);
    },
  ),
];
