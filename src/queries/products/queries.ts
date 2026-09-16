"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchProductCategories,
  fetchProductCrafts,
  fetchProductListClient,
  fetchProductMaterials,
} from "@/api/products/client";
import type { ProductListQuery } from "@/api/products/query";
import { publicEnv } from "@/lib/env";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";
import type { ProductCategory } from "@/types/product-filter";

import { productKeys } from "./keys";

export function useProductList(
  query: ProductListQuery,
  enabled: boolean,
  initialData?: Page<ProductSummary>,
) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: ({ signal }) => fetchProductListClient(query, signal),
    placeholderData: keepPreviousData,
    initialData,
    enabled,
    staleTime: 60000,
  });
}

export function useProductCategories(
  enabled: boolean,
  initialData?: ProductCategory[],
) {
  return useQuery({
    queryKey: productKeys.categories,
    initialData,
    queryFn: ({ signal }) => fetchProductCategories(signal),
    enabled,
    staleTime: 3600000,
  });
}

export function useProductMaterials(enabled: boolean) {
  // TODO #48: PD 분류별 소재 조회를 연결할 때 요청과 query key에 category를
  // 함께 넣어 서로 다른 분류의 선택지가 캐시를 공유하지 않게 한다.
  return useQuery({
    queryKey: productKeys.materials,
    queryFn: ({ signal }) => fetchProductMaterials(signal),
    enabled,
    staleTime: 3600000,
  });
}

export function useProductCrafts(enabled: boolean) {
  // TODO #48: PD 분류별 요청·캐시와 상품 목록의 복수 필터를 함께 검증한 뒤
  // 아래 제한과 ProductFilters·search-params·목록 직렬화의 MSW 제한을 해제한다.
  return useQuery({
    queryKey: productKeys.crafts,
    queryFn: ({ signal }) => fetchProductCrafts(signal),
    enabled: enabled && publicEnv.apiMocking,
    staleTime: 3600000,
  });
}
