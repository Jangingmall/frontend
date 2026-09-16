"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductReviews } from "@/queries/reviews/queries";
import type { ProductNotify } from "@/types/product-detail";
import type { ReviewFilters, ReviewSort } from "@/types/review";

import { ReviewItem } from "./ReviewItem";
import { ReviewStars } from "./ReviewStars";

interface ProductReviewsProps {
  productId: number;
  isMock: boolean;
  onNotify: ProductNotify;
  onRequireLogin: () => void;
}
const SORT_ITEMS = [
  { value: "latest", label: "최신순" },
  { value: "high", label: "별점 높은 순" },
  { value: "low", label: "별점 낮은 순" },
];

export function ProductReviews(props: ProductReviewsProps) {
  return (
    <section
      id="product-reviews"
      className="scroll-mt-40 border-t border-border-neutral-weak px-2 pt-4 pb-3"
    >
      <Suspense fallback={<ReviewLoading />}>
        <ReviewUrlState {...props} />
      </Suspense>
    </section>
  );
}
function ReviewUrlState(props: ProductReviewsProps) {
  const search = useSearchParams();
  const rawSort = search.get("reviewSort");
  const sort: ReviewSort =
    rawSort === "high" || rawSort === "low" ? rawSort : "latest";
  const rawPage = Number(search.get("reviewPage"));
  return (
    <ReviewContent
      key={props.productId}
      {...props}
      filters={{
        page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
        sort,
        photoOnly: search.get("photoOnly") === "true",
      }}
    />
  );
}
function ReviewContent({
  productId,
  isMock,
  filters,
}: ProductReviewsProps & { filters: ReviewFilters }) {
  const pathname = usePathname();
  const query = useProductReviews(productId, filters, isMock);
  function changeFilters(next: Partial<ReviewFilters>) {
    const updated = { ...filters, ...next };
    const search = new URLSearchParams(window.location.search);
    search.set("reviewPage", String(updated.page));
    search.set("reviewSort", updated.sort);
    search.set("photoOnly", String(updated.photoOnly));
    window.history.pushState(
      null,
      "",
      `${pathname}?${search}${window.location.hash}`,
    );
  }
  if (!isMock)
    return (
      <>
        <h2 className="text-title-l leading-[1.3] font-bold">후기</h2>
        <EmptyState title="후기 조회를 준비 중입니다." />
      </>
    );
  const {
    items = [],
    totalCount = 0,
    reviewCount,
    rating = null,
  } = query.data ?? {};
  return (
    <>
      <h2 className="text-title-l leading-[1.3] font-bold text-font-dark">
        후기{reviewCount !== undefined ? ` (${reviewCount})` : ""}
      </h2>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ReviewStars rating={rating} size="m" />
          <span className="text-title-l text-font-dark">
            {query.isPending
              ? "—"
              : rating === null
                ? "평점 없음"
                : rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox
            checked={filters.photoOnly}
            onCheckedChange={(photoOnly) =>
              changeFilters({ photoOnly, page: 1 })
            }
          >
            사진 후기만 보기
          </Checkbox>
          <Select
            ariaLabel="후기 정렬"
            items={SORT_ITEMS}
            value={filters.sort}
            onValueChange={(value) => {
              if (value) changeFilters({ sort: value as ReviewSort, page: 1 });
            }}
            className="w-25"
          >
            {SORT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      {query.isPending ? (
        <ReviewLoading />
      ) : query.isError ? (
        <ErrorState
          title="후기를 불러오지 못했어요"
          onRetry={() => void query.refetch()}
        />
      ) : items.length ? (
        <div className="mt-3 space-y-3 px-2" aria-busy={query.isFetching}>
          {items.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            reviewCount === 0
              ? "등록된 후기가 없습니다."
              : filters.page > 1
                ? "이 페이지에 후기가 없습니다."
                : "등록된 사진 후기가 없습니다."
          }
        />
      )}
      {totalCount > 0 && (
        <Pagination
          className="mt-8 justify-center"
          aria-label="후기 페이지 이동"
          page={filters.page}
          pageCount={Math.ceil(totalCount / 5)}
          onPageChange={(page) => changeFilters({ page })}
        />
      )}
    </>
  );
}
function ReviewLoading() {
  return (
    <div aria-label="후기 불러오는 중" role="status" className="space-y-4">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-36 w-full" />
    </div>
  );
}
