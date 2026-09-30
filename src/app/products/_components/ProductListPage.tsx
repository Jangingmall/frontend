"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { ProductListQuery } from "@/api/products/query";
import {
  DESIGN_MATERIALS,
  resolveCategoryView,
} from "@/app/products/_lib/category-view";
import {
  PRODUCT_FILTER_WIDTH_CLASS,
  PRODUCT_LIST_MAIN_CLASS,
} from "@/app/products/_lib/product-list-layout";
import {
  parseProductSearchParams,
  updateProductSearchParams,
} from "@/app/products/_lib/search-params";
import { SiteFloatingActions } from "@/app/site-floating-actions";
import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { startMockWorker } from "@/mocks/start-browser";
import { productKeys } from "@/queries/products/keys";
import {
  useProductCategories,
  useProductCrafts,
  useProductList,
  useProductMaterials,
} from "@/queries/products/queries";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";
import type { ProductCategory } from "@/types/product-filter";

import { ProductFilters } from "./ProductFilters";
import { ProductFilterSheet } from "./ProductFilterSheet";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // 필터 시트는 lg 미만에서만 쓴다. 열린 채 lg 이상으로 넓어지면 `lg:hidden` 버튼처럼 화면에서만
  // 숨겨질 뿐 모달의 스크롤 잠금이 남으므로 상태를 닫는다.
  useEffect(() => {
    if (!isFilterOpen) return;
    const media = window.matchMedia?.("(min-width: 64rem)");
    if (!media) return;
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) setIsFilterOpen(false);
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [isFilterOpen]);

  const categories = useProductCategories(isReady, initialCategories);
  const view = resolveCategoryView(query.category, categories.data ?? []);
  const apiQuery = { ...query, category: view.apiCategory };
  const hasInitialQuery =
    productKeys.list(apiQuery)[2] === productKeys.list(initialQuery)[2];
  const products = useProductList(
    apiQuery,
    isReady && view.isMapped,
    hasInitialQuery && view.isMapped ? initialData : undefined,
  );
  const materials = useProductMaterials(
    isReady && Boolean(view.apiCategory),
    view.apiCategory,
  );
  const category = view.category;
  const crafts = useProductCrafts(
    isReady && category?.parentId != null && view.isMapped,
    view.apiCategory,
  );
  const parent = view.categories.find((item) => item.id === category?.parentId);

  // 사이드바(lg 이상)와 필터 시트(lg 미만)가 같은 데이터를 본다.
  const filterData = {
    categories: view.categories,
    materials: materials.data ?? (publicEnv.apiMocking ? DESIGN_MATERIALS : []),
    crafts: crafts.data ?? [],
    isCraftsPending: crafts.isPending,
    hasCraftsError: crafts.isError,
    onRetryCrafts: () => {
      void crafts.refetch();
    },
  };

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
      giftTheme: undefined,
      crafts: [],
      materials: [],
      minPrice: undefined,
      maxPrice: undefined,
      hasGiftWrap: false,
      excludeSoldOut: false,
    });
  }

  return (
    <main className={PRODUCT_LIST_MAIN_CLASS}>
      {hasStartupError ? (
        <ErrorState
          title="상품을 불러오지 못했어요"
          onRetry={() => window.location.reload()}
        />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {query.category &&
            (category ? (
              <>
                <ProductFilters
                  {...filterData}
                  query={query}
                  category={category}
                  onChange={handleChange}
                  onReset={handleReset}
                />
                <ProductFilterSheet
                  {...filterData}
                  open={isFilterOpen}
                  onOpenChange={setIsFilterOpen}
                  query={query}
                  category={category}
                  onApply={(patch) => {
                    handleChange(patch);
                    setIsFilterOpen(false);
                  }}
                />
              </>
            ) : categories.isPending ? (
              <Skeleton
                className={cn(
                  "hidden h-48 w-full lg:block",
                  PRODUCT_FILTER_WIDTH_CLASS,
                )}
              />
            ) : null)}
          <div className="min-w-0 flex-1">
            <ProductToolbar
              category={category}
              parent={parent}
              sort={query.sort ?? (publicEnv.apiMocking ? "popular" : "newest")}
              onSortChange={(sort) => handleChange({ sort })}
              onFilterOpen={category ? () => setIsFilterOpen(true) : undefined}
            />
            <ProductResults
              isCategoryList={Boolean(query.category)}
              isUnavailable={
                !view.isMapped && !categories.isPending && !categories.isError
              }
              data={products.data}
              isPending={products.isPending}
              isFetching={products.isFetching}
              hasError={products.isError || categories.isError}
              excludeSoldOut={query.excludeSoldOut ?? false}
              onExcludeSoldOutChange={(excludeSoldOut) =>
                handleChange({ excludeSoldOut })
              }
              onPageChange={(page) => {
                handleChange({ page });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onRetry={() => {
                if (categories.isError) void categories.refetch();
                void products.refetch();
              }}
              onReset={handleReset}
            />
          </div>
        </div>
      )}
      {query.category && <SiteFloatingActions />}
    </main>
  );
}
