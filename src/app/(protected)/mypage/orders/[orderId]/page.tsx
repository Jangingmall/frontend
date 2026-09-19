"use client";

import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useState } from "react";

import type { ChangeOrderAddressRequest } from "@/api/orders/api";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveErrorMessage } from "@/constants/error-messages";
import type { OrderCardActionType } from "@/constants/order";
import { ApiError } from "@/lib/http/api-error";
import {
  useCancelOrderMutation,
  useChangeOrderAddressMutation,
  useConfirmPurchaseMutation,
} from "@/queries/orders/mutations";
import {
  useOrderDeliveryQuery,
  useOrderDetailQuery,
} from "@/queries/orders/queries";
import type { OrderDetailItem } from "@/types/order";

import { DeliveryTrackingModal } from "./_components/DeliveryTrackingModal";
import { OrderAddressChangeModal } from "./_components/OrderAddressChangeModal";
import { OrderDetailArtisanGroup } from "./_components/OrderDetailArtisanGroup";
import { OrderDetailBackLink } from "./_components/OrderDetailBackLink";
import { OrderDetailInfoBar } from "./_components/OrderDetailInfoBar";
import { OrderShippingPaymentPanel } from "./_components/OrderShippingPaymentPanel";

/**
 * 주문 상세(`/mypage/orders/[orderId]`, Figma MY-1-OD). 인증 데이터라 서버 프리페치는
 * 하지 않는다(T-27과 동일 패턴). 실제로 연결하는 액션은 배송지 변경·배송 조회·주문 취소·
 * 구매 확정 4개뿐 — 후기 작성·교환환불신청·장바구니담기 등은 각각 별도 작업(T-29/T-30 등)
 * 범위라 버튼은 보이되 아직 연결하지 않는다(design.md §4·§8).
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
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const cancelMutation = useCancelOrderMutation(orderId);
  const confirmPurchaseMutation = useConfirmPurchaseMutation(orderId);
  const changeAddressMutation = useChangeOrderAddressMutation(orderId);
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
  const canChangeAddress =
    overallStatus === "PAYMENT_PENDING" || overallStatus === "PREPARING";

  function reportError(error: unknown) {
    setActionError(
      error instanceof ApiError
        ? resolveErrorMessage(error.code, error.status)
        : resolveErrorMessage(),
    );
  }

  async function handleAction(
    _item: OrderDetailItem,
    action: OrderCardActionType,
  ) {
    setActionError(null);
    try {
      switch (action) {
        case "cancelOrder":
          await cancelMutation.mutateAsync();
          break;
        case "confirmPurchase":
          await confirmPurchaseMutation.mutateAsync();
          break;
        case "changeAddress":
          setIsAddressModalOpen(true);
          break;
        case "checkDelivery":
          setIsDeliveryModalOpen(true);
          break;
        default:
          // 후기 작성·교환환불신청·장바구니담기·1:1 문의 등은 후속 작업 범위 — 연결하지 않는다.
          break;
      }
    } catch (error) {
      reportError(error);
    }
  }

  async function handleChangeAddress(input: ChangeOrderAddressRequest) {
    setActionError(null);
    try {
      await changeAddressMutation.mutateAsync(input);
      setIsAddressModalOpen(false);
    } catch (error) {
      reportError(error);
    }
  }

  return (
    <div className={PAGE_CONTAINER_CLASS}>
      <div className="flex flex-col gap-6">
        <OrderDetailBackLink />

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
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {order.groups.map((group) => (
              <OrderDetailArtisanGroup
                key={group.artisanName ?? "unknown-artisan"}
                group={group}
                shippingAmount={order.payment.shippingAmount}
                orderedAt={order.orderedAt}
                onAction={(item, action) => void handleAction(item, action)}
              />
            ))}
          </div>

          <OrderShippingPaymentPanel
            address={order.shippingAddress}
            payment={order.payment}
            canChangeAddress={canChangeAddress}
            onChangeAddress={() => setIsAddressModalOpen(true)}
          />
        </div>

        <OrderAddressChangeModal
          open={isAddressModalOpen}
          onOpenChange={setIsAddressModalOpen}
          initialValue={order.shippingAddress}
          submitting={changeAddressMutation.isPending}
          submitError={actionError}
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
      </div>
    </div>
  );
}
