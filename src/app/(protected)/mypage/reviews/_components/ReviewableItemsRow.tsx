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
    <div className="flex w-108 shrink-0 flex-col gap-2.5 rounded-xs border border-border-neutral-subtle bg-bg-default p-3">
      <div className="flex items-center justify-between">
        <p className="truncate text-title-s text-font-dark">
          {item.productName}
        </p>
        <p className="shrink-0 text-body-s text-font-dark">
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
        <div className="flex min-w-0 flex-1 shrink-0 flex-col gap-1 self-start text-body-s text-font-dark">
          {item.options.map((option, index) => (
            <p key={`${item.orderItemId}-option-${index}`} className="truncate">
              {option}
            </p>
          ))}
        </div>
        <div className="relative shrink-0">
          <Button
            variant="solid"
            className="h-auto min-w-22 px-6 py-2 text-[14px] leading-[1.4] font-semibold"
            onClick={() => onWriteReview(item)}
          >
            후기 작성하기
          </Button>
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
            <div className="relative rounded-xs bg-(--button-jade) px-2 py-1 text-center text-caption-b whitespace-nowrap text-font-dark">
              적립금 + {item.rewardPoints}원
              {/* 말풍선 꼬리 — Figma "Vector 156"(1271:53686)을 그대로 옮김: 뱃지 왼쪽에 치우쳐
                  아래로 5px 삐져나온다(대칭 삼각형이 아니라 비대칭 잎사귀 모양). */}
              <div
                className="absolute top-[20px] left-[3px] flex h-[7px] w-[5px] items-center justify-center overflow-hidden"
                style={{ containerType: "size" }}
              >
                <div className="h-[100cqw] w-[100cqh] flex-none -scale-x-100 rotate-90">
                  <div className="relative size-full">
                    <div className="absolute inset-[18.83%_0_0_30.27%]">
                      <svg
                        viewBox="0 0 4.88144 4.05857"
                        fill="none"
                        className="block size-full"
                        aria-hidden
                      >
                        <path
                          d="M0.420666 2.24484L3.3002 0.188029C3.96207 -0.284734 4.88144 0.188391 4.88144 1.00176V4.05857H1.0019C0.0290647 4.05857 -0.370966 2.81029 0.420666 2.24484Z"
                          fill="var(--button-jade)"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
