"use client";

import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getOrderDetailActions,
  ORDER_CARD_ACTION_LABEL,
  ORDER_STATUS_LABEL,
  type OrderCardActionType,
} from "@/constants/order";
import type { Money } from "@/types/money";
import type { OrderDetailItem } from "@/types/order";

/**
 * 주문 유의사항 — Figma 실측(`2080:116574` 등) 고정 3줄. 상품 옵션·상태와 무관하게
 * 모든 아이템 블록에 동일하게 표시된다.
 */
const ORDER_NOTICE_LINES = [
  "교환·환불은 배송 완료일 기준 7일 이내 신청 가능합니다.",
  "주문제작 상품은 단순 변심에 의한 교환·환불이 불가합니다.",
  "단순 변심 교환·환불 시 왕복 배송비가 청구됩니다.",
];

interface OrderDetailItemCardProps {
  item: OrderDetailItem;
  /** 주문 전체 배송비를 그대로 복제해서 표시한다(T-28 design.md §9-B). */
  shippingAmount: Money;
  reason?: string;
  onAction?: (action: OrderCardActionType) => void;
}

/**
 * 주문 상세 화면의 상품 한 줄. 목록 카드(`OrderProductCard`)와 달리 옵션·아이템 주문번호·
 * 배송비 분리 표시를 더 담아 별도 컴포넌트로 둔다(design.md §1).
 */
export function OrderDetailItemCard({
  item,
  shippingAmount,
  reason,
  onAction,
}: OrderDetailItemCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = getOrderDetailActions(item.status, !!reason);
  // 4개면 첫 액션을 전체 너비 단독 줄로, 나머지를 아래 한 줄로(design.md §2, Figma DELIVERED 실측).
  const isSplitLayout = actions.length === 4;
  const primaryAction = isSplitLayout ? actions[0] : null;
  const restActions = isSplitLayout ? actions.slice(1) : actions;

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
    <div className="flex flex-col gap-3 border-b border-border-neutral-weak p-4 text-font-dark last:border-b-0">
      <div className="flex items-center justify-between">
        <Badge variant="plain">{ORDER_STATUS_LABEL[item.status]}</Badge>
        <div className="flex items-center gap-1.5 text-body-s text-font-dark-secondary">
          <span>상품 주문번호 {item.orderItemId}</span>
          <button
            type="button"
            onClick={() => void handleCopyOrderItemId()}
            className="underline underline-offset-2"
          >
            {copied ? "복사됨" : "복사"}
          </button>
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

      <div className="flex flex-col gap-1 text-body-s">
        <div className="flex justify-between text-font-dark-secondary">
          <span>배송비</span>
          <span>{shippingAmount.toLocaleString("ko-KR")}원</span>
        </div>
        <div className="flex justify-between text-title-s">
          <span>상품 금액</span>
          <span>{(item.price * item.quantity).toLocaleString("ko-KR")}원</span>
        </div>
      </div>

      {reason && (
        <div className="flex flex-wrap items-center justify-center gap-1 bg-fill-neutral-weak px-4 py-2 text-center text-body-l">
          <span>{ORDER_STATUS_LABEL[item.status]} 사유 :</span>
          <span>{reason}</span>
        </div>
      )}

      <div className="bg-fill-neutral-weak px-3 py-2 text-caption text-font-dark-subtle">
        <p className="mb-1 text-caption-b text-font-dark">주문 유의사항</p>
        {ORDER_NOTICE_LINES.map((line) => (
          <p key={line}>- {line}</p>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {primaryAction && (
          <Button
            variant="solid"
            size="m"
            className="w-full"
            disabled={!onAction}
            onClick={() => onAction?.(primaryAction.action)}
          >
            {ORDER_CARD_ACTION_LABEL[primaryAction.action]}
          </Button>
        )}
        <div className="flex items-center gap-2">
          {restActions.map(({ action, withReward }) => (
            <div key={action} className="relative flex-1">
              <Button
                variant="solid"
                size="m"
                className="w-full"
                disabled={!onAction}
                onClick={() => onAction?.(action)}
              >
                {ORDER_CARD_ACTION_LABEL[action]}
              </Button>
              {withReward && (
                <span className="absolute -top-2.5 right-0 rounded-xs bg-(--button-jade) px-2 py-1 text-caption-b text-font-dark">
                  적립금 + 100원
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
