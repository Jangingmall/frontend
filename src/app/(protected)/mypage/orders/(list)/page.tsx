"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { OrderCancelRequestModal } from "@/components/order/OrderCancelRequestModal";
import { OrderExchangeRefundRequestModal } from "@/components/order/OrderExchangeRefundRequestModal";
import { resolveErrorMessage } from "@/constants/error-messages";
import {
  type OrderCardActionType,
  type OrderPeriodPreset,
  type OrderStatusGroupKey,
  resolveOrderPeriod,
} from "@/constants/order";
import { ApiError } from "@/lib/http/api-error";
import {
  useRequestOrderCancelMutation,
  useRequestOrderExchangeRefundMutation,
} from "@/queries/orders/mutations";
import {
  useOrdersListQuery,
  useOrderStatusSummaryQuery,
} from "@/queries/orders/queries";
import type {
  OrderCancelRequest,
  OrderExchangeRefundRequest,
  OrderGroup,
  OrderListItem,
} from "@/types/order";

import { OrdersFilterBar } from "./_components/OrdersFilterBar";
import { OrdersList } from "./_components/OrdersList";
import { OrdersStatusSummary } from "./_components/OrdersStatusSummary";
import {
  type OrdersFilterState,
  parseOrdersSearchParams,
  toOrdersListQuery,
  updateOrdersSearchParams,
} from "./_lib/search-params";

interface ClaimTarget {
  orderId: number;
  orderNumber: string;
  /** ISO datetime — 주문 전체 값, `OrderClaimProductSummary`의 "N 구매" 표시용. */
  orderedAt: string;
  item: OrderListItem;
}

/**
 * 마이페이지 진입 화면(Figma MY-1, `/mypage/orders`) — 주문 상태 요약 + 기간·상태·장인 이름
 * 필터 + 주문 목록. 인증 데이터라 서버 프리페치는 하지 않는다(`AddressesTab`과 동일 패턴 —
 * SSR엔 접근 토큰이 없다). 필터 변경은 `products` 목록과 동일하게 shallow
 * `history.pushState`로 URL만 갱신한다(design.md §6.4).
 *
 * "주문 취소"·"교환·환불 신청" 버튼은 취소·교환·환불 신청 모달을 연다(design.md §0.5, §5.2) —
 * T-27은 이 배선을 상세 화면 몫으로 미뤄뒀지만, 이번에 목록에도 처음 연결한다.
 */
export default function MypageOrdersPage() {
  const searchParams = useSearchParams();
  const filterState = parseOrdersSearchParams(
    new URLSearchParams(searchParams.toString()),
  );

  const summaryQuery = useOrderStatusSummaryQuery();
  const listQuery = useOrdersListQuery(toOrdersListQuery(filterState));

  const [cancelTarget, setCancelTarget] = useState<ClaimTarget | null>(null);
  const [exchangeTarget, setExchangeTarget] = useState<ClaimTarget | null>(
    null,
  );
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const cancelMutation = useRequestOrderCancelMutation(
    cancelTarget?.orderId ?? -1,
  );
  const exchangeMutation = useRequestOrderExchangeRefundMutation(
    exchangeTarget?.orderId ?? -1,
  );

  function updateUrl(patch: Partial<OrdersFilterState>) {
    const params = updateOrdersSearchParams(
      new URLSearchParams(window.location.search),
      patch,
    );
    window.history.pushState(
      null,
      "",
      `/mypage/orders${params.size ? `?${params}` : ""}`,
    );
  }

  function resolveActionErrorMessage(error: unknown) {
    return error instanceof ApiError
      ? resolveErrorMessage(error.code, error.status)
      : resolveErrorMessage();
  }

  function handleAction(
    order: OrderGroup,
    item: OrderListItem,
    action: OrderCardActionType,
  ) {
    const target: ClaimTarget = {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      orderedAt: order.orderedAt,
      item,
    };
    switch (action) {
      case "cancelOrder":
        setCancelError(null);
        setCancelTarget(target);
        break;
      case "requestExchangeRefund":
        setExchangeError(null);
        setExchangeTarget(target);
        break;
      default:
        // ORDER_LIST_IMPLEMENTED_ACTIONS에 없는 액션 — 버튼 자체가 비활성이라 도달하지 않는다.
        break;
    }
  }

  async function handleCancelSubmit(input: OrderCancelRequest) {
    setCancelError(null);
    try {
      await cancelMutation.mutateAsync(input);
      setCancelTarget(null);
    } catch (error) {
      setCancelError(resolveActionErrorMessage(error));
    }
  }

  async function handleExchangeSubmit(input: OrderExchangeRefundRequest) {
    setExchangeError(null);
    try {
      await exchangeMutation.mutateAsync(input);
      setExchangeTarget(null);
    } catch (error) {
      setExchangeError(resolveActionErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <OrdersStatusSummary
          data={summaryQuery.data}
          isPending={summaryQuery.isPending}
          hasError={summaryQuery.isError}
          onRetry={() => void summaryQuery.refetch()}
        />
        <OrdersFilterBar
          period={filterState.period}
          from={filterState.from}
          to={filterState.to}
          status={filterState.status}
          artisanName={filterState.artisanName}
          onPeriodChange={(preset: OrderPeriodPreset) => {
            const range = resolveOrderPeriod(preset);
            updateUrl({ period: preset, from: range.from, to: range.to });
          }}
          onCustomRangeChange={(range) =>
            updateUrl({ period: "CUSTOM", from: range.from, to: range.to })
          }
          onStatusChange={(status: "ALL" | OrderStatusGroupKey) =>
            updateUrl({ status })
          }
          onSearch={(artisanName) =>
            updateUrl({ artisanName: artisanName || undefined })
          }
        />
      </div>
      <OrdersList
        data={listQuery.data}
        isPending={listQuery.isPending}
        isFetching={listQuery.isFetching}
        hasError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        onPageChange={(page) => updateUrl({ page })}
        onAction={handleAction}
      />

      {cancelTarget && (
        <OrderCancelRequestModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setCancelTarget(null);
              setCancelError(null);
            }
          }}
          item={cancelTarget.item}
          purchasedAt={cancelTarget.orderedAt}
          orderNumber={cancelTarget.orderNumber}
          submitting={cancelMutation.isPending}
          submitError={cancelError}
          onSubmit={(input) => void handleCancelSubmit(input)}
        />
      )}

      {exchangeTarget && (
        <OrderExchangeRefundRequestModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setExchangeTarget(null);
              setExchangeError(null);
            }
          }}
          item={exchangeTarget.item}
          orderItemId={exchangeTarget.item.orderItemId}
          purchasedAt={exchangeTarget.orderedAt}
          orderNumber={exchangeTarget.orderNumber}
          submitting={exchangeMutation.isPending}
          submitError={exchangeError}
          onSubmit={(input) => void handleExchangeSubmit(input)}
        />
      )}
    </div>
  );
}
