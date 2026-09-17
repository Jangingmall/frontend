import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";
import { clientFetch } from "@/lib/http/client";

import { fetchBackendProductList } from "./backend-list";
import { mapBackendProductCategories } from "./backend-mapper";
import {
  productCategoriesDto,
  productCraftsDto,
  productMaterialsDto,
} from "./filter-validation";
import { canUseProductCrafts, canUseProductMaterials } from "./integration";
import {
  mapProductCategories,
  mapProductCrafts,
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
  const read = (path: string) =>
    clientFetch<unknown>(path, { auth: false, signal });
  if (!publicEnv.apiMocking)
    return fetchBackendProductList(query, read, () =>
      fetchProductCategories(signal),
    );
  return mapProductListPage(
    productListResponseDto.parse(
      await read(`/api/products?${toProductListSearchParams(query)}`),
    ),
    resolveProductListPaging(query),
  );
}
export async function fetchProductCategories(signal?: AbortSignal) {
  const read = (path: string) =>
    clientFetch<unknown>(path, { auth: false, signal });
  const dto = await read("/api/products/categories");
  return publicEnv.apiMocking
    ? mapProductCategories(productCategoriesDto.parse(dto))
    : mapBackendProductCategories(
        dto,
        await read("/api/products/subcategories"),
      );
}
export async function fetchProductMaterials(
  _category?: string,
  signal?: AbortSignal,
) {
  if (!canUseProductMaterials())
    throw new ApiError(503, { errorCode: "PRODUCT_MATERIALS_NOT_READY" });
  return mapProductMaterials(
    productMaterialsDto.parse(
      await clientFetch<unknown>("/api/products/materials", {
        auth: false,
        signal,
      }),
    ),
  );
}
export async function fetchProductCrafts(
  _category?: string,
  signal?: AbortSignal,
) {
  if (!canUseProductCrafts())
    throw new ApiError(503, { errorCode: "PRODUCT_CRAFTS_NOT_READY" });
  return mapProductCrafts(
    productCraftsDto.parse(
      await clientFetch<unknown>("/api/products/subcategories", {
        auth: false,
        signal,
      }),
    ),
  );
}
