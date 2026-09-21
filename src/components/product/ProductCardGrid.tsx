"use client";

import type { ReactNode } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Pagination } from "@/components/ui/pagination";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { ProductCard } from "./ProductCard";
import { ProductGridSkeleton } from "./ProductGridSkeleton";

interface WishInteraction {
  /** 현재 페이지에 보이는 카드 중 찜된 상품 id. */
  wishedIds: Set<number>;
  onToggle: (productId: number) => void;
}

interface ProductCardGridProps {
  data?: Page<ProductSummary>;
  isPending: boolean;
  isFetching: boolean;
  hasError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /**
   * 있으면 각 카드에 찜 토글 인터랙션을 건다. 없으면 하트는 `ProductCard` 기본 동작대로
   * 비활성 표시된다.
   */
  wishInteraction?: WishInteraction;
}

/**
 * 4열 상품 카드 그리드 + 번호 페이지네이션 + 로딩/빈/에러 상태. `app/products/_components/
 * ProductResults.tsx`의 그리드·상태 표현을 필터 툴바 없이 추출한 공용 버전 — 마이페이지
 * 찜 목록·최근 본 상품 두 화면이 공유한다.
 */
export function ProductCardGrid({
  data,
  isPending,
  isFetching,
  hasError,
  onRetry,
  onPageChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
  wishInteraction,
}: ProductCardGridProps) {
  if (hasError) {
    return <ErrorState title="상품을 불러오지 못했어요" onRetry={onRetry} />;
  }

  if (isPending || !data) {
    return <ProductGridSkeleton />;
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div aria-busy={isFetching} className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
        {data.items.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            isAboveFold={index < 4}
            isWishlisted={wishInteraction?.wishedIds.has(product.id) ?? false}
            onWishlist={
              wishInteraction
                ? () => wishInteraction.onToggle(product.id)
                : undefined
            }
          />
        ))}
      </div>
      <Pagination
        page={data.page}
        pageCount={data.totalPages}
        onPageChange={onPageChange}
        className="justify-center"
      />
    </div>
  );
}
