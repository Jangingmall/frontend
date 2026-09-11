import { clientFetch } from "@/lib/http/client";

import { productCategoriesDto, productMaterialsDto } from "./filter-validation";
import {
  mapProductCategories,
  mapProductListPage,
  mapProductMaterials,
} from "./mapper";
import {
  type ProductListQuery,
  resolveProductListPaging,
  toProductListSearchParams,
} from "./query";
import { productListResponseDto } from "./validation";

export async function fetchProductListClient(
  query: ProductListQuery,
  signal?: AbortSignal,
) {
  const dto = await clientFetch<unknown>(
    `/api/products?${toProductListSearchParams(query)}`,
    { auth: false, signal },
  );
  return mapProductListPage(
    productListResponseDto.parse(dto),
    resolveProductListPaging(query),
  );
}

export async function fetchProductCategories(signal?: AbortSignal) {
  const dto = await clientFetch<unknown>("/api/products/categories", {
    auth: false,
    signal,
  });
  return mapProductCategories(productCategoriesDto.parse(dto));
}

export async function fetchProductMaterials(signal?: AbortSignal) {
  const dto = await clientFetch<unknown>("/api/products/materials", {
    auth: false,
    signal,
  });
  return mapProductMaterials(productMaterialsDto.parse(dto));
}
