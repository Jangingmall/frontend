"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchProductCategories,
  fetchProductListClient,
  fetchProductMaterials,
} from "@/api/products/client";
import type { ProductListQuery } from "@/api/products/query";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

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

export function useProductCategories(enabled: boolean) {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: ({ signal }) => fetchProductCategories(signal),
    enabled,
    staleTime: 3600000,
  });
}

export function useProductMaterials(enabled: boolean) {
  return useQuery({
    queryKey: productKeys.materials,
    queryFn: ({ signal }) => fetchProductMaterials(signal),
    enabled,
    staleTime: 3600000,
  });
}
