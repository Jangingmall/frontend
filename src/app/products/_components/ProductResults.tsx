"use client";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { ProductGridSkeleton } from "./ProductGridSkeleton";

interface ProductResultsProps {
  data?: Page<ProductSummary>;
  isPending: boolean;
  isFetching: boolean;
  hasError: boolean;
  excludeSoldOut: boolean;
  onExcludeSoldOutChange: (value: boolean) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onReset: () => void;
}

export function ProductResults({
  data,
  isPending,
  isFetching,
  hasError,
  excludeSoldOut,
  onExcludeSoldOutChange,
  onPageChange,
  onRetry,
  onReset,
}: ProductResultsProps) {
  return (
    <section aria-label="상품 목록" className="mt-12">
      <div className="mb-3 flex min-h-6 items-center justify-between gap-3">
        <p role="status" className="text-body-s text-font-dark">
          {isFetching
            ? "상품을 불러오는 중"
            : hasError
              ? "조회 실패"
              : `총 ${(data?.totalCount ?? 0).toLocaleString("ko-KR")}개`}
        </p>
        <Checkbox
          checked={excludeSoldOut}
          onCheckedChange={onExcludeSoldOutChange}
        >
          품절 상품 제외
        </Checkbox>
      </div>
      {hasError ? (
        <ErrorState title="상품을 불러오지 못했어요" onRetry={onRetry} />
      ) : isPending ? (
        <ProductGridSkeleton />
      ) : !data?.items.length ? (
        <EmptyState
          title="조건에 맞는 상품이 없어요"
          description="다른 조건으로 상품을 찾아보세요."
          action={
            <Button variant="outline" size="s" onClick={onReset}>
              필터 초기화
            </Button>
          }
        />
      ) : (
        <>
          <div
            aria-busy={isFetching}
            className="grid grid-cols-2 gap-x-6 gap-y-6 xl:grid-cols-4"
          >
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            page={data.page}
            pageCount={data.totalPages}
            onPageChange={onPageChange}
            className="mt-25 justify-center gap-1 sm:gap-2 [&_button]:size-8 sm:[&_button]:size-9"
          />
        </>
      )}
    </section>
  );
}
