import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { catalogGridClassName } from "./catalog-grid";

interface ProductGridSkeletonProps {
  /**
   * `catalog`는 상품 목록(`/products`)의 반응형 그리드와 같은 열 수를 쓴다. 기본은 마이페이지
   * 찜·최근 본 상품(`ProductCardGrid`)의 2열/4열 그리드 — 본문 그리드와 열 수가 어긋나지 않게
   * 소비처마다 맞춘다.
   */
  layout?: "default" | "catalog";
  isCategoryList?: boolean;
}

export function ProductGridSkeleton({
  layout = "default",
  isCategoryList = false,
}: ProductGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="상품 불러오는 중"
      className={cn(
        layout === "catalog"
          ? catalogGridClassName(isCategoryList)
          : "grid grid-cols-2 gap-6 xl:grid-cols-4",
      )}
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  );
}
