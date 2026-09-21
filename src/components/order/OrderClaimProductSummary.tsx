"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useState } from "react";

import type { OrderClaimItemSummary } from "@/types/order";

interface OrderClaimProductSummaryProps {
  item: OrderClaimItemSummary;
  /** ISO datetime. 후기 작성 화면은 BE가 아직 안 내려줘 없을 수 있다(`be-requests.md` #11). */
  purchasedAt: string | null;
}

/**
 * 취소·교환·환불 신청 모달(MY-request·MY-exchange)이 공유하는 상품 요약 — 썸네일 + 상품명 +
 * 구매일자 + (있으면) 옵션정보. 목록(`OrderListItem`)에서 열면 옵션이 없어(BE 목록 API 계약에
 * 옵션 필드 자체가 없음, `be-requests.md` #8) 그 줄을 그린다/안 그린다로 나뉜다.
 */
export function OrderClaimProductSummary({
  item,
  purchasedAt,
}: OrderClaimProductSummaryProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-body-s-b text-font-dark">상품명</p>
        {purchasedAt != null && (
          <p className="text-caption text-font-dark-subtle">
            {dayjs(purchasedAt).format("YYYY.MM.DD")} 구매
          </p>
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden bg-fill-jade-weak">
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
          <p className="truncate text-body-s-b text-font-dark">
            {item.productName}
          </p>
          {item.options?.map((option, index) => (
            <p
              key={`${item.productName}-option-${index}`}
              className="text-caption text-font-dark-subtle"
            >
              {option}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
