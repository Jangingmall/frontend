"use client";

import Image from "next/image";
import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReviewableItem } from "@/types/review";

interface ReviewableItemsRowProps {
  nickname?: string;
  data: ReviewableItem[] | undefined;
  isPending: boolean;
  hasError: boolean;
  onRetry: () => void;
  onWriteReview: (item: ReviewableItem) => void;
}

function ReviewableItemCard({
  item,
  onWriteReview,
}: {
  item: ReviewableItem;
  onWriteReview: (item: ReviewableItem) => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  return (
    <div className="flex w-108 shrink-0 flex-col gap-2.5 border border-border-neutral-solid p-3">
      <div className="flex items-center justify-between text-body-s">
        <p className="truncate text-title-s text-font-dark">
          {item.productName}
        </p>
        <p className="shrink-0 text-caption text-font-dark-subtle">
          {new Date(item.purchasedAt).toLocaleDateString("ko-KR")} 구매
        </p>
      </div>
      <div className="flex items-end gap-4">
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
        <div className="flex min-w-0 flex-1 flex-col gap-1 text-caption text-font-dark">
          {item.options.map((option, index) => (
            <p key={`${item.orderItemId}-option-${index}`} className="truncate">
              {option}
            </p>
          ))}
        </div>
        <div className="relative shrink-0">
          <span className="absolute -top-6 right-0 rounded-xs bg-(--button-jade) px-2 py-1 text-caption-b whitespace-nowrap text-font-dark">
            적립금 + {item.rewardPoints}원
          </span>
          <Button variant="solid" size="m" onClick={() => onWriteReview(item)}>
            후기 작성하기
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 마이페이지 후기 화면(MY-3) — "빠른 후기 작성" 섹션. 리뷰 미작성 + 배송완료 주문
 * 아이템을 가로 스크롤 카드로 보여준다. */
export function ReviewableItemsRow({
  nickname,
  data,
  isPending,
  hasError,
  onRetry,
  onWriteReview,
}: ReviewableItemsRowProps) {
  if (hasError) {
    return (
      <ErrorState
        title="후기를 기다리는 상품을 불러오지 못했어요"
        onRetry={onRetry}
      />
    );
  }

  if (isPending || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-40 w-108" />
          <Skeleton className="h-40 w-108" />
        </div>
      </div>
    );
  }

  const namePrefix = nickname ? `${nickname} 님의 ` : "";

  if (data.length === 0) {
    return (
      <p className="text-title-m text-font-dark">
        {namePrefix}후기를 기다리는 상품이 아직 없어요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-title-m text-font-dark">
        {namePrefix}후기를 기다리는 상품이 {data.length}건 있어요
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {data.map((item) => (
          <ReviewableItemCard
            key={item.orderItemId}
            item={item}
            onWriteReview={onWriteReview}
          />
        ))}
      </div>
    </div>
  );
}
