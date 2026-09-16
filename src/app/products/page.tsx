import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  fetchProductCategoriesServer,
  fetchProductList,
} from "@/api/products/api";
import { getQueryClient } from "@/lib/query/server";
import { productKeys } from "@/queries/products/keys";

import { ProductGridSkeleton } from "./_components/ProductGridSkeleton";
import { ProductListPage } from "./_components/ProductListPage";
import { parseProductSearchParams } from "./_lib/search-params";
import { getProductSeo } from "./_lib/seo";

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const { canonical, hasFilters } = getProductSeo(params);
  return {
    title: "상품 목록 | 장인몰",
    alternates: {
      canonical,
    },
    robots: hasFilters ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const query = parseProductSearchParams(params);
  // 초기 조회 실패는 클라이언트의 재시도 가능한 상태 UI에서 처리한다. prefetchQuery는
  // 실패를 삼키고(캐시에 에러 상태로만 남김) 절대 reject하지 않는다 — Promise.all이
  // 이 실패 때문에 통째로 실패하지 않는다.
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: productKeys.list(query),
      queryFn: () => fetchProductList(query),
    }),
    queryClient.prefetchQuery({
      queryKey: productKeys.categories,
      queryFn: () => fetchProductCategoriesServer(),
    }),
  ]);
  return (
    <Suspense
      fallback={
        <ProductGridSkeleton isCategoryList={Boolean(query.category)} />
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductListPage initialQuery={query} />
      </HydrationBoundary>
    </Suspense>
  );
}
