import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  fetchProductCategoriesServer,
  fetchProductList,
} from "@/api/products/api";
import { ProductGridSkeleton } from "@/components/product/ProductGridSkeleton";
import { getQueryClient } from "@/lib/query/server";
import { productKeys } from "@/queries/products/keys";
import type { ProductCategory } from "@/types/product-filter";

import { ProductListPage } from "./_components/ProductListPage";
import { resolveCategoryView } from "./_lib/category-view";
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
  // 실패를 캐시에 남기므로 분류 응답 실패가 전체 페이지 렌더링을 막지 않는다.
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: productKeys.categories,
    queryFn: () => fetchProductCategoriesServer(),
  });
  const categories =
    queryClient.getQueryData<ProductCategory[]>(productKeys.categories) ?? [];
  const view = resolveCategoryView(query.category, categories);
  if (view.isMapped) {
    const apiQuery = { ...query, category: view.apiCategory };
    await queryClient.prefetchQuery({
      queryKey: productKeys.list(apiQuery),
      queryFn: () => fetchProductList(apiQuery),
    });
  }

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
