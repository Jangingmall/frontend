"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

import { OrderCancelRequestModal } from "@/components/order/OrderCancelRequestModal";
import { OrderExchangeRefundRequestModal } from "@/components/order/OrderExchangeRefundRequestModal";
import { PurchaseConfirmationDialog } from "@/components/order/PurchaseConfirmationDialog";
import { ReviewFormModal } from "@/components/review/ReviewFormModal";
import { resolveErrorMessage } from "@/constants/error-messages";
import {
  type OrderCardActionType,
  type OrderPeriodPreset,
  type OrderStatusGroupKey,
  resolveOrderPeriod,
} from "@/constants/order";
import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";
import {
  useConfirmPurchaseMutation,
  useRequestOrderCancelMutation,
  useRequestOrderExchangeRefundMutation,
} from "@/queries/orders/mutations";
import {
  useOrdersListQuery,
  useOrderStatusSummaryQuery,
} from "@/queries/orders/queries";
import { useCreateReviewMutation } from "@/queries/reviews/mutations";
import type {
  OrderCancelRequest,
  OrderExchangeRefundRequest,
  OrderGroup,
  OrderListItem,
} from "@/types/order";
import type { ReviewFormInput } from "@/types/review";

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
 * "주문 취소"·"교환·환불 신청" 버튼은 취소·교환·환불 신청 모달을 연다 — T-27은 이 배선을
 * 상세 화면 몫으로 미뤄뒀지만, T-29에서 목록에도 처음 연결했다. "후기 작성" 버튼도 같은
 * 자리에서 처음 연결한다 — 마이페이지 후기 화면(`/mypage/reviews`)과 같은 `ReviewFormModal`
 * 을 공유한다.
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
  const [reviewTarget, setReviewTarget] = useState<ClaimTarget | null>(null);
  const [confirmationTarget, setConfirmationTarget] =
    useState<OrderGroup | null>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  );
  const confirmationInFlight = useRef(false);
  const confirmMutation = useConfirmPurchaseMutation(
    confirmationTarget?.orderId ?? -1,
  );
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const cancelMutation = useRequestOrderCancelMutation(
    cancelTarget?.orderId ?? -1,
  );
  const exchangeMutation = useRequestOrderExchangeRefundMutation(
    exchangeTarget?.orderId ?? -1,
  );
  const createReviewMutation = useCreateReviewMutation();

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
      case "confirmPurchase":
        setConfirmationError(null);
        setConfirmationTarget(order);
        break;
      case "cancelOrder":
        setCancelError(null);
        setCancelTarget(target);
        break;
      case "requestExchangeRefund":
        setExchangeError(null);
        setExchangeTarget(target);
        break;
      case "writeReview":
        setReviewError(null);
        setReviewTarget(target);
        break;
      default:
        // ORDER_LIST_IMPLEMENTED_ACTIONS에 없는 액션 — 버튼 자체가 비활성이라 도달하지 않는다.
        break;
    }
  }

  async function handleConfirmPurchase() {
    if (!confirmationTarget || confirmationInFlight.current) return;
    confirmationInFlight.current = true;
    setConfirmationError(null);
    try {
      await confirmMutation.mutateAsync();
      setConfirmationTarget(null);
    } catch (error) {
      setConfirmationError(resolveActionErrorMessage(error));
    } finally {
      confirmationInFlight.current = false;
    }
  }

  async function handleCancelSubmit(input: OrderCancelRequest) {
    if (
      cancelMutation.isPending ||
      (!publicEnv.apiMocking && cancelTarget?.item.status !== "PAYMENT_PENDING")
    )
      return;
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

  async function handleReviewSubmit(input: ReviewFormInput) {
    if (!reviewTarget) return;
    setReviewError(null);
    try {
      await createReviewMutation.mutateAsync({
        productId: reviewTarget.item.productId,
        orderItemId: reviewTarget.item.orderItemId,
        input,
      });
      setReviewTarget(null);
    } catch (error) {
      setReviewError(resolveActionErrorMessage(error));
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

      {confirmationTarget && (
        <PurchaseConfirmationDialog
          open
          orderNumber={confirmationTarget.orderNumber}
          submitting={confirmMutation.isPending}
          error={confirmationError}
          onOpenChange={(open) => {
            if (!open) setConfirmationTarget(null);
          }}
          onConfirm={() => void handleConfirmPurchase()}
        />
      )}
      {cancelTarget && (
        <OrderCancelRequestModal
          supportsAttachments={publicEnv.apiMocking}
          notice={
            publicEnv.apiMocking
              ? undefined
              : "이 주문에 포함된 모든 상품이 함께 취소됩니다. 취소 사유·사진 저장은 준비 중입니다."
          }
          unavailableReason={
            !publicEnv.apiMocking &&
            cancelTarget.item.status !== "PAYMENT_PENDING"
              ? "현재 결제 대기 주문만 취소할 수 있습니다."
              : undefined
          }
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

      {reviewTarget && (
        <ReviewFormModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setReviewTarget(null);
              setReviewError(null);
            }
          }}
          item={reviewTarget.item}
          purchasedAt={reviewTarget.orderedAt}
          submitting={createReviewMutation.isPending}
          submitError={reviewError}
          onSubmit={(input) => void handleReviewSubmit(input)}
        />
      )}
    </div>
  );
}
