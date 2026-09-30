"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ProductListSkeleton } from "./_components/ProductListSkeleton";

function CategoryAwareSkeleton() {
  const params = useSearchParams();
  return (
    <ProductListSkeleton isCategoryList={Boolean(params.get("category"))} />
  );
}

/**
 * 라우트 로딩. 쿼리를 알아야 카테고리 목록(필터 자리 + 고정 카드 폭)과 분류 없는 목록(유동 그리드)을
 * 구분할 수 있어 `category` 유무를 클라이언트에서 읽는다. `useSearchParams`는 빌드 시 프리렌더에서
 * Suspense 경계가 필요하므로 분류 없는 목록 스켈레톤을 fallback으로 둔다(요청 시에는 실제 쿼리로 그려진다).
 */
export default function Loading() {
  return (
    <Suspense fallback={<ProductListSkeleton isCategoryList={false} />}>
      <CategoryAwareSkeleton />
    </Suspense>
  );
}
