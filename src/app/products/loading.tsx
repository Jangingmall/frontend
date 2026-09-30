"use client";

import { useSearchParams } from "next/navigation";

import { ProductListSkeleton } from "./_components/ProductListSkeleton";

/**
 * 라우트 로딩. 쿼리를 알아야 카테고리 목록(필터 자리 + 고정 카드 폭)과 분류 없는 목록(유동 그리드)을
 * 구분할 수 있어 클라이언트에서 `category` 유무를 읽는다(`/products`는 동적 렌더링).
 */
export default function Loading() {
  const params = useSearchParams();
  return (
    <ProductListSkeleton isCategoryList={Boolean(params.get("category"))} />
  );
}
