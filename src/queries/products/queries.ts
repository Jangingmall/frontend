"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchProductCategories,
  fetchProductCrafts,
  fetchProductListClient,
  fetchProductMaterials,
} from "@/api/products/client";
import {
  canUseProductCrafts,
  canUseProductMaterials,
} from "@/api/products/integration";
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

export function useProductMaterials(enabled: boolean, category?: string) {
  return useQuery({
    queryKey: productKeys.materials(category),
    queryFn: ({ signal }) => fetchProductMaterials(category, signal),
    enabled:
      enabled &&
      canUseProductMaterials() &&
      (publicEnv.apiMocking || Boolean(category)),
    staleTime: 3600000,
  });
}

export function useProductCrafts(enabled: boolean, category?: string) {
  return useQuery({
    queryKey: productKeys.crafts(category),
    queryFn: ({ signal }) => fetchProductCrafts(category, signal),
    enabled:
      enabled &&
      canUseProductCrafts() &&
      (publicEnv.apiMocking || Boolean(category)),
    staleTime: 3600000,
  });
}
