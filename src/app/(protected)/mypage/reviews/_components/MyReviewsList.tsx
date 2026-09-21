"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ChevronRightIcon, StarFilledIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { MyReviewPage } from "@/types/review";

interface MyReviewsListProps {
  data: MyReviewPage | undefined;
  isPending: boolean;
  isFetching: boolean;
  hasError: boolean;
  onRetry: () => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function MyReviewRow({ review }: { review: MyReviewPage["items"][number] }) {
  const [hasImageError, setHasImageError] = useState(false);
  return (
    <div className="flex flex-col bg-bg-default">
      <div className="flex items-center justify-between bg-fill-neutral-weak px-3 py-2 text-title-s text-font-dark">
        <p className="truncate">{review.productName}</p>
        <p className="shrink-0 text-body-s text-font-dark">
          작성일 {new Date(review.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
      <div className="flex items-stretch gap-4 p-3">
        <div className="relative size-22.5 shrink-0 overflow-hidden bg-fill-jade-weak">
          <Image
            src={
              hasImageError || !review.thumbnailUrl
                ? "/images/product-placeholder.png"
                : review.thumbnailUrl
            }
            alt=""
            fill
            unoptimized
            className="object-cover"
            onError={() => setHasImageError(true)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex flex-col gap-1">
            <p className="truncate text-title-s text-font-dark">
              {review.productName}
            </p>
            <span
              aria-label={`평점 ${review.rating.toFixed(1)}`}
              className="inline-flex shrink-0 items-center justify-end gap-1 text-body-m text-font-label"
            >
              <StarFilledIcon className="size-5" aria-hidden="true" />
              {review.rating.toFixed(1)}
            </span>
          </div>
          <p className="line-clamp-2 text-body-s text-font-dark">
            {review.content}
          </p>
        </div>
        <button
          type="button"
          disabled
          title="준비 중"
          className="flex shrink-0 items-end gap-1 self-stretch pb-1 text-body-m text-font-dark-secondary disabled:cursor-default disabled:opacity-60"
        >
          후기 자세히 보기
          <ChevronRightIcon aria-hidden className="size-6" />
        </button>
      </div>
    </div>
  );
}

/** 마이페이지 후기 화면(MY-3) — "내가 작성한 후기" 섹션. */
export function MyReviewsList({
  data,
  isPending,
  isFetching,
  hasError,
  onRetry,
  page,
  pageSize,
  onPageChange,
}: MyReviewsListProps) {
  if (hasError) {
    return (
      <ErrorState
        title="내가 작성한 후기를 불러오지 못했어요"
        onRetry={onRetry}
      />
    );
  }

  if (isPending || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-30 w-full" />
        <Skeleton className="h-30 w-full" />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="아직 작성한 후기가 없습니다."
        action={
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-xs border border-(--button-border-black) px-6 text-body-m text-font-dark transition-colors hover:bg-states-hover"
          >
            상품 보러 가기
          </Link>
        }
      />
    );
  }

  const pageCount = Math.max(1, Math.ceil(data.totalCount / pageSize));

  return (
    <div className="flex flex-col gap-4" aria-busy={isFetching}>
      <p className="text-title-m text-font-dark">내가 작성한 후기</p>
      <div className="flex flex-col gap-4">
        {data.items.map((review) => (
          <MyReviewRow key={review.id} review={review} />
        ))}
      </div>
      <div className="mt-17 flex justify-center">
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
