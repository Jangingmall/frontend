"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOrderDetailActions,
  getOrderDetailNoticeLines,
  getOrderDetailReasonLabel,
  getOrderDetailReasonSuffix,
  ORDER_CARD_ACTION_LABEL,
  ORDER_DETAIL_ACTION_LABEL,
  ORDER_DETAIL_IMPLEMENTED_ACTIONS,
  ORDER_STATUS_LABEL,
  type OrderCardActionType,
} from "@/constants/order";
import type { Money } from "@/types/money";
import type { OrderDetailItem } from "@/types/order";

interface OrderDetailItemCardProps {
  item: OrderDetailItem;
  /** 주문 전체 배송비를 그대로 복제해서 표시한다(T-28 design.md §9-B). */
  shippingAmount: Money;
  /**
   * Figma 실측 — 헤더 좌측에 "주문일시 / 구매확정일 / 배송예정일 등 표시"라고 돼 있어
   * 상태별로 다른 날짜를 보여줘야 함을 알 수 있다. `OrderDetail`엔 주문일시(`orderedAt`)
   * 밖에 없어(구매확정일·배송예정일 필드는 BE에 없음) 우선 주문일시로만 채운다.
   */
  orderedAt: string;
  reason?: string;
  /**
   * 주문 취소 주체 — "주문 취소" 상태에서 사유 유무만으론 소비자·장인 취소를 못
   * 가른다(둘 다 사유 배너가 있다, constants/order.ts 참고). 생략하면 사유 유무로
   * 근사한다.
   */
  cancelInitiator?: "consumer" | "artisan";
  /** "입금 정보 확인" 버튼 노출 조건 판단용(constants/order.ts 참고). */
  paymentMethod?: string | null;
  onAction?: (action: OrderCardActionType) => void;
}

/**
 * 주문 상세 화면의 상품 한 줄. 목록 카드(`OrderProductCard`)와 달리 옵션·아이템 주문번호·
 * 배송비 분리 표시를 더 담아 별도 컴포넌트로 둔다(design.md §1).
 */
export function OrderDetailItemCard({
  item,
  shippingAmount,
  orderedAt,
  reason,
  cancelInitiator,
  paymentMethod,
  onAction,
}: OrderDetailItemCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = getOrderDetailActions(
    item.status,
    !!reason,
    paymentMethod,
    cancelInitiator,
    item.reviewId != null,
  );
  // 대표 액션(있으면 solid 단독 한 줄) + 나머지(outline, 균등폭 한 줄) — Figma 실측
  // (`1718:16488`). 대표 액션은 항상 배열 맨 앞이다(constants/order.ts 참고).
  const primaryAction = actions[0]?.style === "solid" ? actions[0] : null;
  const restActions = primaryAction ? actions.slice(1) : actions;
  const noticeLines = getOrderDetailNoticeLines(item.status);

  function actionLabel(action: OrderCardActionType) {
    return ORDER_DETAIL_ACTION_LABEL[action] ?? ORDER_CARD_ACTION_LABEL[action];
  }

  // 눌러도 반응 없는 버튼으로 보이지 않도록 구현 안 된 액션은 onAction 유무와
  // 무관하게 비활성 처리한다(독립 리뷰 F2).
  function isActionDisabled(action: OrderCardActionType) {
    return !onAction || !ORDER_DETAIL_IMPLEMENTED_ACTIONS.has(action);
  }

  async function handleCopyOrderItemId() {
    try {
      await navigator.clipboard.writeText(String(item.orderItemId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패는 조용히 무시 — 사용자가 텍스트를 직접 선택해 복사할 수 있다.
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border-neutral-weak px-4 py-3 text-font-dark">
      <div className="flex flex-col gap-1">
        <Badge variant="plain" className="self-start">
          {ORDER_STATUS_LABEL[item.status]}
        </Badge>
        <div className="flex items-center justify-between text-body-s">
          <span>주문일시 : {dayjs(orderedAt).format("YYYY.MM.DD")}</span>
          <div className="flex items-center gap-1">
            <span>상품 주문번호 {item.orderItemId}</span>
            <button
              type="button"
              onClick={() => void handleCopyOrderItemId()}
              className="text-caption underline underline-offset-2"
            >
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="relative size-22.5 shrink-0 overflow-hidden bg-fill-jade-weak">
          <Image
            src={
              hasImageError || !item.thumbnailUrl
                ? "/images/product-placeholder.png"
                : item.thumbnailUrl
            }
            alt=""
            fill
            unoptimized
            className="object-cover"
            onError={() => setHasImageError(true)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-body-s-b">{item.productName}</p>
          {item.options.map((option, index) => (
            <p
              key={`${item.orderItemId}-option-${index}`}
              className="text-caption text-font-dark-subtle"
            >
              - {option}
            </p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-end gap-2 text-body-s">
          <span>배송비</span>
          <span>{shippingAmount.toLocaleString("ko-KR")}원</span>
        </div>
        <div className="flex justify-end gap-2 text-body-m font-bold">
          <span>상품 금액</span>
          <span>{(item.price * item.quantity).toLocaleString("ko-KR")}원</span>
        </div>
      </div>

      {reason && (
        // Figma 실측 — 이 배너는 카드 자체의 좌우 padding(px-4) 안에서 이미 꽉 찬
        // 너비라 자체 가로 padding은 없다(세로 py-2만).
        <div className="flex flex-wrap items-center justify-center gap-1 bg-fill-neutral-weak py-2 text-center text-body-l">
          <span>{getOrderDetailReasonLabel(item.status)}</span>
          <span>{reason}</span>
          {getOrderDetailReasonSuffix(item.status) && (
            <span>{getOrderDetailReasonSuffix(item.status)}</span>
          )}
        </div>
      )}

      {noticeLines && (
        <div className="flex items-start gap-10 bg-fill-jade-weak p-2 text-caption text-font-label">
          <p className="shrink-0 font-semibold">주문 유의사항</p>
          <div className="flex flex-col gap-1">
            {noticeLines.map((line) => (
              <p key={line} className="flex gap-1">
                <span>-</span>
                <span>{line}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {primaryAction && (
          // Figma 실측 — 상세 화면 액션 버튼 글자는 항상 16px/Medium(500)("body-l-btn"
          // 텍스트 스타일), size="m"의 기본 text-body-m(14px)보다 크다.
          <Button
            variant="solid"
            size="m"
            className="w-full text-button-xl"
            disabled={isActionDisabled(primaryAction.action)}
            onClick={() => onAction?.(primaryAction.action)}
          >
            {actionLabel(primaryAction.action)}
          </Button>
        )}
        <div className="flex items-center gap-2">
          {restActions.map(({ action }) => (
            <Button
              key={action}
              variant="outline"
              size="m"
              className="flex-1 text-button-xl"
              disabled={isActionDisabled(action)}
              onClick={() => onAction?.(action)}
            >
              {actionLabel(action)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
