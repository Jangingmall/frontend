"use client";

import { Ellipsis } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  getOrderCardActions,
  ORDER_CARD_ACTION_LABEL,
  ORDER_STATUS_LABEL,
  type OrderCardActionType,
  type OrderStatus,
} from "@/constants/order";
import type { ImageRef } from "@/types/image";
import type { Money } from "@/types/money";
import { pickThumbnailVariant } from "@/utils/image";

interface OrderProductCardBaseProps {
  /**
   * 상품 도메인(`ProductCard` 등)은 3-variant `ImageRef`를 쓰지만, 주문 목록 API는
   * 단일 CDN URL 문자열만 준다(BE 계약 확정 — `장인몰 주문 이력 API 계약서` §3-1
   * `thumbnailUrl`). 둘 다 받아 어느 쪽이든 렌더링한다.
   */
  thumbnail: ImageRef | string | null;
  productName: string;
  price: Money;
  onViewDetail?: () => void;
}

interface OrderProductCardDetailedProps extends OrderProductCardBaseProps {
  variant?: "detailed";
  status: OrderStatus;
  /**
   * "{상태 라벨} 사유 : {reason}" 형태로 표시(예: "주문 취소 사유 : ...",
   * "교환 불가 사유 : ..."). 있으면 액션 버튼도 `inquiry` 하나로 좁혀진다
   * (`getOrderCardActions` 가 처리).
   */
  reason?: string;
  /**
   * 카드 자신의 상태 배지를 상단에 표시할지. 기본 `false`(단일 상품 주문 —
   * `OrderInfoBar` 가 이미 이 상태를 보여줘서 중복). 다중 상품 주문을 펼쳤을 때는
   * `OrderInfoBar` 가 "총 N 건"이라 개별 상태를 안 보여주므로 이때만 `true`로 켠다.
   */
  showStatusBadge?: boolean;
  onAction?: (action: OrderCardActionType) => void;
}

interface OrderProductCardCompactProps extends OrderProductCardBaseProps {
  /** "복수주문" 축약 카드 — 상태·액션·사유 없음. 다중 상품 주문의 접힌 대표 카드 */
  variant: "compact";
}

type OrderProductCardProps =
  OrderProductCardDetailedProps | OrderProductCardCompactProps;

/** 마이페이지 주문 목록·상세에서 상품 한 줄을 보여주는 순수 프레젠테이션 컴포넌트. */
export function OrderProductCard(props: OrderProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const thumbnailUrl =
    typeof props.thumbnail === "string"
      ? props.thumbnail
      : props.thumbnail
        ? pickThumbnailVariant(props.thumbnail, 320)?.url
        : undefined;
  const isDetailed = props.variant !== "compact";

  return (
    <div className="flex flex-col gap-3 p-3 text-font-dark">
      {isDetailed && props.showStatusBadge && (
        <Badge variant="plain">{ORDER_STATUS_LABEL[props.status]}</Badge>
      )}
      <div className="flex items-center gap-3">
        <div className="relative size-22.5 shrink-0 overflow-hidden bg-fill-jade-weak">
          <Image
            src={
              hasImageError || !thumbnailUrl
                ? "/images/product-placeholder.png"
                : thumbnailUrl
            }
            alt=""
            fill
            unoptimized
            className="object-cover"
            onError={() => setHasImageError(true)}
          />
        </div>
        <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-2 self-stretch">
          <div className="flex flex-col gap-1 text-body-s-b">
            <p className="truncate">{props.productName}</p>
            <p className="text-right whitespace-nowrap">
              {props.price.toLocaleString("ko-KR")}원
            </p>
          </div>
          <button
            type="button"
            onClick={props.onViewDetail}
            disabled={!props.onViewDetail}
            className="ml-auto flex items-center gap-1 text-body-s text-font-dark-secondary disabled:cursor-default"
          >
            주문 상세보기
            <ChevronRightIcon aria-hidden className="size-6" />
          </button>
        </div>
      </div>

      {isDetailed && props.reason && (
        <div className="flex flex-wrap items-center justify-center gap-1 bg-fill-neutral-weak px-4 py-2 text-center text-body-l">
          <span>{ORDER_STATUS_LABEL[props.status]} 사유 :</span>
          <span>{props.reason}</span>
        </div>
      )}

      {isDetailed && (
        <div className="flex items-center gap-2">
          {getOrderCardActions(props.status, !!props.reason).map(
            ({ action, withReward }) => (
              <div key={action} className="relative flex-1">
                <Button
                  variant="solid"
                  size="m"
                  className="w-full"
                  disabled={!props.onAction}
                  onClick={() => props.onAction?.(action)}
                >
                  {ORDER_CARD_ACTION_LABEL[action]}
                </Button>
                {withReward && (
                  <span className="absolute -top-2.5 right-0 rounded-xs bg-(--button-jade) px-2 py-1 text-caption-b text-font-dark">
                    적립금 + 100원
                  </span>
                )}
              </div>
            ),
          )}
          <button
            type="button"
            disabled
            title="준비 중"
            aria-label="기타"
            className="flex size-13 shrink-0 items-center justify-center rounded-xs border border-border-neutral-weak disabled:cursor-default disabled:opacity-60"
          >
            <Ellipsis aria-hidden className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
