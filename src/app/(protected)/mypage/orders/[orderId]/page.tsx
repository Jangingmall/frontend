"use client";

import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

import type { ChangeOrderAddressRequest } from "@/api/orders/api";
import { ErrorState } from "@/components/common/error-state";
import { OrderCancelRequestModal } from "@/components/order/OrderCancelRequestModal";
import { OrderExchangeRefundRequestModal } from "@/components/order/OrderExchangeRefundRequestModal";
import { PurchaseConfirmationDialog } from "@/components/order/PurchaseConfirmationDialog";
import { ReviewFormModal } from "@/components/review/ReviewFormModal";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveErrorMessage } from "@/constants/error-messages";
import type { OrderCardActionType } from "@/constants/order";
import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";
import {
  useChangeOrderAddressMutation,
  useConfirmPurchaseMutation,
  useRequestOrderCancelMutation,
  useRequestOrderExchangeRefundMutation,
} from "@/queries/orders/mutations";
import {
  useOrderDeliveryQuery,
  useOrderDetailQuery,
} from "@/queries/orders/queries";
import { useCreateReviewMutation } from "@/queries/reviews/mutations";
import type {
  OrderCancelRequest,
  OrderDetailItem,
  OrderExchangeRefundRequest,
} from "@/types/order";
import type { ReviewFormInput } from "@/types/review";

import { DeliveryTrackingModal } from "./_components/DeliveryTrackingModal";
import { OrderAddressChangeModal } from "./_components/OrderAddressChangeModal";
import { OrderDetailArtisanGroup } from "./_components/OrderDetailArtisanGroup";
import { OrderDetailBackLink } from "./_components/OrderDetailBackLink";
import { OrderDetailInfoBar } from "./_components/OrderDetailInfoBar";
import { OrderShippingPaymentPanel } from "./_components/OrderShippingPaymentPanel";

/**
 * 주문 상세(`/mypage/orders/[orderId]`, Figma MY-1-OD). 인증 데이터라 서버 프리페치는
 * 하지 않는다(T-27과 동일 패턴). 실제로 연결하는 액션은 배송지 변경·배송 조회·주문 취소·
 * 구매 확정·교환·환불 신청·후기 작성 6개뿐 — 장바구니담기 등은 아직 연결하지 않는다.
 * "주문 취소"·"교환·환불 신청"은 즉시 실행이 아니라 모달(사유+사진 입력)을 연다 — MY-1
 * 리스트와 같은 모달을 공유한다. "후기 작성"도 마이페이지 후기 화면(`/mypage/reviews`)과
 * 같은 `ReviewFormModal`을 공유한다.
 *
 * dynamic segment는 `use(params)`(Next 공식 예시)가 아니라 `useParams()`로 읽는다 —
 * 로컬 확인 중 `use(params)` + 존재하지 않는 주문(404) 조합에서 페이지가 계속 재요청되는
 * 현상을 봤다. 재현 도중 이 세션의 MSW 서비스워커도 같이 깨져 있어 원인을 `use(params)`
 * 자체로 확정하진 못했지만, `useParams()`가 더 안전한 선택지라 이걸 쓴다.
 *
 * Figma MY-1-OD는 마이페이지 사이드바가 없는 별도 화면이다(design.md §0 실측) — 그래서
 * `mypage/orders/(list)/layout.tsx`(`MypageShell`, 사이드바 포함) 밖의 형제 라우트로 뒀다
 * (사용자 피드백으로 발견 — 원래 그 레이아웃 안에 있었음). `MypageShell`이 주던 페이지
 * 컨테이너(최대폭·좌우 여백)를 여기서 직접 진다 — 상품 상세(`ProductDetailPage`)와 같은
 * "GNB 아래 독립 페이지" 패턴이라 그 컨테이너 클래스를 그대로 재사용한다.
 */
const PAGE_CONTAINER_CLASS =
  "mx-auto w-full max-w-desktop px-4 pt-8 pb-24 sm:px-6 lg:px-12 lg:pt-12";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);

  const detailQuery = useOrderDetailQuery(orderId);
  const actionInFlight = useRef(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  // 배송지 변경 모달 전용 에러 — `actionError`(페이지 배너)와 같은 값을 쓰면 모달이
  // 열린 채로 변경이 실패했을 때 배너·모달 두 군데에 같은 문구가 중복 표시된다
  // (독립 리뷰 Nit). 취소·교환환불 모달도 같은 이유로 전용 에러를 둔다.
  const [addressChangeError, setAddressChangeError] = useState<string | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = useState<OrderDetailItem | null>(
    null,
  );
  const [exchangeTarget, setExchangeTarget] = useState<OrderDetailItem | null>(
    null,
  );
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<OrderDetailItem | null>(
    null,
  );
  const [reviewError, setReviewError] = useState<string | null>(null);

  const confirmPurchaseMutation = useConfirmPurchaseMutation(orderId);
  const changeAddressMutation = useChangeOrderAddressMutation(orderId);
  const cancelMutation = useRequestOrderCancelMutation(orderId);
  const exchangeMutation = useRequestOrderExchangeRefundMutation(orderId);
  const createReviewMutation = useCreateReviewMutation();
  const deliveryQuery = useOrderDeliveryQuery(orderId, isDeliveryModalOpen);

  if (detailQuery.isError) {
    const error = detailQuery.error;
    // 존재하지 않거나 본인 주문이 아닌 경우도 `NOT_FOUND`(404)로 온다(design.md §5).
    // `next/navigation`의 `notFound()`는 쓰지 않는다 — 비동기로 나중에 확정되는 이
    // Client Component 상태에서 호출했을 때 페이지가 계속 재요청되는 현상을 로컬에서
    // 봤다(위 `useParams()` 주석 참고). 인라인 `ErrorState`가 더 안전하다. 재시도해도
    // 결과가 똑같은 404는 재시도 버튼을 보여주지 않는다.
    const isNotFound = error instanceof ApiError && error.status === 404;
    return (
      <div className={PAGE_CONTAINER_CLASS}>
        <ErrorState
          title={isNotFound ? "주문을 찾을 수 없어요" : undefined}
          code={error instanceof ApiError ? error.code : undefined}
          status={error instanceof ApiError ? error.status : undefined}
          onRetry={isNotFound ? undefined : () => void detailQuery.refetch()}
        />
      </div>
    );
  }

  if (detailQuery.isPending) {
    return (
      <div className={PAGE_CONTAINER_CLASS}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const order = detailQuery.data;
  const overallStatus = order.groups[0]?.items[0]?.status;
  // Figma 스펙시트(2080:112091, 상태별 버튼 정리) 재확인 결과 "배송지 변경"은
  // 주문 확인 중·상품 준비 중에만 노출된다 — 입금 확인 중은 대상이 아니다(설계 당시
  // 가정이 틀렸었다, design.md §4.3 정정 필요).
  const canChangeAddress =
    overallStatus === "ORDER_PENDING" || overallStatus === "PREPARING";

  function resolveActionErrorMessage(error: unknown) {
    return error instanceof ApiError
      ? resolveErrorMessage(error.code, error.status)
      : resolveErrorMessage();
  }

  async function handleAction(
    item: OrderDetailItem,
    action: OrderCardActionType,
  ) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);
    try {
      switch (action) {
        case "cancelOrder":
          setCancelError(null);
          setCancelTarget(item);
          break;
        case "requestExchangeRefund":
          setExchangeError(null);
          setExchangeTarget(item);
          break;
        case "confirmPurchase":
          setConfirmationError(null);
          setConfirmationOpen(true);
          break;
        case "checkDelivery":
          setIsDeliveryModalOpen(true);
          break;
        case "writeReview":
          setReviewError(null);
          setReviewTarget(item);
          break;
        default:
          // 장바구니담기·1:1 문의·교환/환불 신청 취소·상품 회수 안내 등은 후속 작업
          // 범위 — 연결하지 않는다.
          break;
      }
    } catch (error) {
      setActionError(resolveActionErrorMessage(error));
    } finally {
      actionInFlight.current = false;
    }
  }

  async function handleConfirmPurchase() {
    if (actionInFlight.current || !confirmationOpen) return;
    actionInFlight.current = true;
    setConfirmationError(null);
    try {
      await confirmPurchaseMutation.mutateAsync();
      setConfirmationOpen(false);
    } catch (error) {
      setConfirmationError(resolveActionErrorMessage(error));
    } finally {
      actionInFlight.current = false;
    }
  }

  async function handleChangeAddress(input: ChangeOrderAddressRequest) {
    setAddressChangeError(null);
    try {
      await changeAddressMutation.mutateAsync(input);
      setIsAddressModalOpen(false);
    } catch (error) {
      setAddressChangeError(resolveActionErrorMessage(error));
    }
  }

  async function handleCancelSubmit(input: OrderCancelRequest) {
    if (
      cancelMutation.isPending ||
      (!publicEnv.apiMocking && cancelTarget?.status !== "PAYMENT_PENDING")
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
        productId: reviewTarget.productId,
        orderItemId: reviewTarget.orderItemId,
        input,
      });
      setReviewTarget(null);
    } catch (error) {
      setReviewError(resolveActionErrorMessage(error));
    }
  }

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <OrderDetailBackLink />
      {/* Figma 실측 — 뒤로가기와 정보 바 사이 간격만 64px, 나머지 섹션 간격은 24px
          (spacing-description 주석 대조, T-28 재실측). */}
      <div className="mt-16 flex flex-col gap-6">
        <OrderDetailInfoBar
          orderNumber={order.orderNumber}
          orderDate={dayjs(order.orderedAt).format("YYYY.MM.DD")}
        />

        {actionError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {actionError}
          </p>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <fieldset
            disabled={confirmPurchaseMutation.isPending}
            className="flex min-w-0 flex-1 flex-col gap-6"
          >
            {order.groups.map((group) => (
              <OrderDetailArtisanGroup
                key={group.artisanName ?? "unknown-artisan"}
                group={group}
                shippingAmount={order.payment.shippingAmount}
                orderedAt={order.orderedAt}
                paymentMethod={order.payment.paymentMethod}
                onAction={(item, action) => void handleAction(item, action)}
              />
            ))}
          </fieldset>

          <OrderShippingPaymentPanel
            address={order.shippingAddress}
            payment={order.payment}
            canChangeAddress={canChangeAddress}
            onChangeAddress={() => setIsAddressModalOpen(true)}
          />
        </div>

        <PurchaseConfirmationDialog
          open={confirmationOpen}
          orderNumber={order.orderNumber}
          submitting={confirmPurchaseMutation.isPending}
          error={confirmationError}
          onOpenChange={setConfirmationOpen}
          onConfirm={() => void handleConfirmPurchase()}
        />
        <OrderAddressChangeModal
          open={isAddressModalOpen}
          onOpenChange={(open) => {
            setIsAddressModalOpen(open);
            // 닫을 때 지난 실패 문구를 지운다 — 안 지우면 다시 열었을 때 새 시도
            // 전인데도 이전 오류가 남아 보인다(독립 리뷰 F3).
            if (!open) setAddressChangeError(null);
          }}
          initialValue={order.shippingAddress}
          submitting={changeAddressMutation.isPending}
          submitError={addressChangeError}
          onSubmit={(input) => void handleChangeAddress(input)}
        />

        <DeliveryTrackingModal
          open={isDeliveryModalOpen}
          onOpenChange={setIsDeliveryModalOpen}
          data={deliveryQuery.data}
          isPending={deliveryQuery.isPending}
          hasError={deliveryQuery.isError}
          onRetry={() => void deliveryQuery.refetch()}
        />

        {cancelTarget && (
          <OrderCancelRequestModal
            supportsAttachments={publicEnv.apiMocking}
            notice={
              publicEnv.apiMocking
                ? undefined
                : "이 주문에 포함된 모든 상품이 함께 취소됩니다. 취소 사유·사진 저장은 준비 중입니다."
            }
            unavailableReason={
              !publicEnv.apiMocking && cancelTarget.status !== "PAYMENT_PENDING"
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
            item={cancelTarget}
            purchasedAt={order.orderedAt}
            orderNumber={order.orderNumber}
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
            item={exchangeTarget}
            orderItemId={exchangeTarget.orderItemId}
            purchasedAt={order.orderedAt}
            orderNumber={order.orderNumber}
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
            item={reviewTarget}
            purchasedAt={order.orderedAt}
            submitting={createReviewMutation.isPending}
            submitError={reviewError}
            onSubmit={(input) => void handleReviewSubmit(input)}
          />
        )}
      </div>
    </div>
  );
}
