import {
  PRODUCT_FILTER_WIDTH_CLASS,
  PRODUCT_LIST_MAIN_CLASS,
} from "@/app/products/_lib/product-list-layout";
import { ProductGridSkeleton } from "@/components/product/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 상품 목록 로딩 화면. 본문(`ProductListPage`)과 같은 껍데기·좌측 필터 자리·카드 트랙을 그려
 * 로딩→본문 전환에서 카드 폭과 위치가 흔들리지 않게 한다. 카테고리 목록(PL-2/3)이면 lg 이상에서
 * 필터 자리를 두고 고정 카드 폭 트랙을, 아니면(PL-1) 유동 트랙을 쓴다.
 */
export function ProductListSkeleton({
  isCategoryList,
}: {
  isCategoryList: boolean;
}) {
  return (
    <main className={PRODUCT_LIST_MAIN_CLASS}>
      <div className="flex flex-col gap-6 lg:flex-row">
        {isCategoryList && (
          <Skeleton
            data-testid="filter-placeholder"
            className={cn(
              "hidden h-48 w-full lg:block",
              PRODUCT_FILTER_WIDTH_CLASS,
            )}
          />
        )}
        <div className="min-w-0 flex-1">
          {/* 툴바 자리: 모바일엔 브레드크럼이 없다 */}
          <Skeleton className="hidden h-4.5 w-56 md:block" />
          <Skeleton className="h-6.5 w-48 md:mt-6 md:h-8.5" />
          <div className="mt-8 mb-3 h-6 md:mt-12" />
          <ProductGridSkeleton
            layout="catalog"
            isCategoryList={isCategoryList}
          />
        </div>
      </div>
    </main>
  );
}
