"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { ProductListQuery } from "@/api/products/query";
import {
  parseProductSearchParams,
  updateProductSearchParams,
} from "@/app/products/_lib/search-params";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { startMockWorker } from "@/mocks/start-browser";
import { productKeys } from "@/queries/products/keys";
import {
  useProductCategories,
  useProductList,
  useProductMaterials,
} from "@/queries/products/queries";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";
import type { ProductCategory } from "@/types/product-filter";

import { ProductFilters } from "./ProductFilters";
import { ProductResults } from "./ProductResults";
import { ProductToolbar } from "./ProductToolbar";

interface ProductListPageProps {
  initialQuery: ProductListQuery;
  initialData?: Page<ProductSummary>;
  initialCategories?: ProductCategory[];
}

export function ProductListPage({
  initialQuery,
  initialData,
  initialCategories,
}: ProductListPageProps) {
  const searchParams = useSearchParams();
  const query = parseProductSearchParams(
    new URLSearchParams(searchParams.toString()),
  );
  const [isReady, setIsReady] = useState(false);
  const [hasStartupError, setHasStartupError] = useState(false);

  useEffect(() => {
    let isActive = true;
    // AuthBootstrap과 공유하는 single-flight 워커 시작을 기다려 첫 조회 유실을 막는다.
    startMockWorker()
      .then(() => {
        if (isActive) setIsReady(true);
      })
      .catch(() => {
        if (isActive) setHasStartupError(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const hasInitialQuery =
    productKeys.list(query)[2] === productKeys.list(initialQuery)[2];
  const products = useProductList(
    query,
    isReady,
    hasInitialQuery ? initialData : undefined,
  );
  const categories = useProductCategories(isReady, initialCategories);
  const materials = useProductMaterials(isReady && Boolean(query.category));
  const category = categories.data?.find((item) => item.id === query.category);
  const parent = categories.data?.find(
    (item) => item.id === category?.parentId,
  );

  function handleChange(patch: Partial<ProductListQuery>) {
    const params = updateProductSearchParams(
      new URLSearchParams(window.location.search),
      patch,
    );
    window.history.pushState(
      null,
      "",
      `/products${params.size ? `?${params}` : ""}`,
    );
  }

  function handleReset() {
    handleChange({
      materials: [],
      minPrice: undefined,
      maxPrice: undefined,
      hasGiftWrap: false,
      excludeSoldOut: false,
    });
  }

  return (
    <main className="mx-auto w-full max-w-desktop px-4 pt-16 pb-24 sm:px-8 lg:px-12">
      {hasStartupError ? (
        <ErrorState
          title="상품을 불러오지 못했어요"
          onRetry={() => window.location.reload()}
        />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {query.category && (
            <>
              {categories.isError || materials.isError ? (
                <div className="lg:w-51 lg:shrink-0">
                  <ErrorState
                    title="필터를 불러오지 못했어요"
                    onRetry={() => {
                      void categories.refetch();
                      void materials.refetch();
                    }}
                  />
                </div>
              ) : category && materials.data ? (
                <ProductFilters
                  query={query}
                  category={category}
                  categories={categories.data ?? []}
                  materials={materials.data}
                  onChange={handleChange}
                  onReset={handleReset}
                />
              ) : categories.isPending || materials.isPending ? (
                <Skeleton className="h-48 w-full lg:w-51 lg:shrink-0" />
              ) : (
                <div className="lg:w-51 lg:shrink-0">
                  <p className="text-body-m">존재하지 않는 상품 분류예요.</p>
                </div>
              )}
            </>
          )}
          <div className="min-w-0 flex-1">
            <ProductToolbar
              category={category}
              parent={parent}
              sort={query.sort ?? "popular"}
              onSortChange={(sort) => handleChange({ sort })}
            />
            <ProductResults
              data={products.data}
              isPending={products.isPending}
              isFetching={products.isFetching}
              hasError={products.isError}
              excludeSoldOut={query.excludeSoldOut ?? false}
              onExcludeSoldOutChange={(excludeSoldOut) =>
                handleChange({ excludeSoldOut })
              }
              onPageChange={(page) => {
                handleChange({ page });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onRetry={() => {
                void products.refetch();
              }}
              onReset={handleReset}
            />
          </div>
        </div>
      )}
    </main>
  );
}
