"use client";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductGridSkeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

interface ProductResultsProps {
  isCategoryList?: boolean;
  isUnavailable?: boolean;
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
  isCategoryList = false,
  isUnavailable = false,
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
          {isUnavailable
            ? ""
            : isFetching
              ? "상품을 불러오는 중"
              : hasError
                ? "조회 실패"
                : `총 ${(data?.totalCount ?? 0).toLocaleString("ko-KR")}개${isCategoryList ? "의 검색 결과" : ""}`}
        </p>
        {publicEnv.apiMocking && (
          <Checkbox
            checked={excludeSoldOut}
            onCheckedChange={onExcludeSoldOutChange}
          >
            품절 상품 제외
          </Checkbox>
        )}
      </div>
      {isUnavailable ? (
        <EmptyState
          title="상품을 준비하고 있어요"
          description="이 카테고리의 상품은 준비되는 대로 만나보실 수 있어요."
        />
      ) : hasError ? (
        <ErrorState title="상품을 불러오지 못했어요" onRetry={onRetry} />
      ) : isPending ? (
        <ProductGridSkeleton isCategoryList={isCategoryList} />
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
            className={cn(
              "grid grid-cols-2 gap-6 xl:grid-cols-4",
              isCategoryList &&
                "justify-between xl:grid-cols-[repeat(4,minmax(0,16.25rem))]",
            )}
          >
            {data.items.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                variant={isCategoryList ? "list" : "default"}
                isAboveFold={index < 4}
              />
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
