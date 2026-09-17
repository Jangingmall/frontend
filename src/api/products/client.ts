import { publicEnv } from "@/lib/env";
import { ApiError } from "@/lib/http/api-error";
import { clientFetch } from "@/lib/http/client";

import {
  mapBackendProductCategories,
  mapBackendProductList,
  resolveProductCategoryCode,
} from "./backend-mapper";
import { backendMaterialsDto, backendOptionsDto } from "./backend-validation";
import {
  productCategoriesDto,
  productCraftsDto,
  productMaterialsDto,
} from "./filter-validation";
import { assertProductListApiReady } from "./integration";
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
  assertProductListApiReady();
  const apiQuery =
    !publicEnv.apiMocking && query.category
      ? {
          ...query,
          category: resolveProductCategoryCode(
            query.category,
            await fetchProductCategories(signal),
          ),
        }
      : query;
  const dto = await clientFetch<unknown>(
    `/api/products?${toProductListSearchParams(apiQuery)}`,
    { auth: false, signal },
  );
  return publicEnv.apiMocking
    ? mapProductListPage(
        productListResponseDto.parse(dto),
        resolveProductListPaging(query),
      )
    : mapBackendProductList(dto);
}

export async function fetchProductCategories(signal?: AbortSignal) {
  assertProductListApiReady();
  const dto = await clientFetch<unknown>("/api/products/categories", {
    auth: false,
    signal,
  });
  return publicEnv.apiMocking
    ? mapProductCategories(productCategoriesDto.parse(dto))
    : mapBackendProductCategories(dto);
}

async function getOptionSearch(category?: string, signal?: AbortSignal) {
  if (publicEnv.apiMocking) return "";
  if (!category)
    throw new ApiError(400, { errorCode: "PRODUCT_CATEGORY_REQUIRED" });
  const code = resolveProductCategoryCode(
    category,
    await fetchProductCategories(signal),
  );
  // TODO 현재 BE materials는 숫자 subcategoryId를 받는다. PD 분류 조건 확정 후 이곳에서 맞춘다.
  return `?${new URLSearchParams({ category: code })}`;
}

export async function fetchProductMaterials(
  category?: string,
  signal?: AbortSignal,
) {
  assertProductListApiReady();
  const search = await getOptionSearch(category, signal);
  const dto = await clientFetch<unknown>(`/api/products/materials${search}`, {
    auth: false,
    signal,
  });
  return publicEnv.apiMocking
    ? mapProductMaterials(productMaterialsDto.parse(dto))
    : backendMaterialsDto
        .parse(dto)
        .map((item) => ({ id: item.code, name: item.name }));
}

export async function fetchProductCrafts(
  category?: string,
  signal?: AbortSignal,
) {
  assertProductListApiReady();
  const search = await getOptionSearch(category, signal);
  // TODO 현재 endpoint는 품목이다. 공예 종목 제공 API/의미 합의 전 운영 설정을 켜지 않는다.
  const dto = await clientFetch<unknown>(
    `/api/products/subcategories${search}`,
    {
      auth: false,
      signal,
    },
  );
  return publicEnv.apiMocking
    ? mapProductCrafts(productCraftsDto.parse(dto))
    : backendOptionsDto
        .parse(dto)
        .map((item) => ({ id: item.code, name: item.name }));
}
