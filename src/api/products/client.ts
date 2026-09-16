import { clientFetch } from "@/lib/http/client";

import {
  productCategoriesDto,
  productCraftsDto,
  productMaterialsDto,
} from "./filter-validation";
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
  // TODO #48: BE 수정 후 PD 분류의 category를 전달해 해당 소재만 조회한다.
  // 확정된 코드와 응답 DTO를 확인한 뒤 query key에도 같은 분류를 포함한다.
  const dto = await clientFetch<unknown>("/api/products/materials", {
    auth: false,
    signal,
  });
  return mapProductMaterials(productMaterialsDto.parse(dto));
}

export async function fetchProductCrafts(signal?: AbortSignal) {
  // TODO #48: BE 수정 후 PD 분류별 종목 선택지를 연결한다. 현재 전체 조회와
  // 숫자 ID 응답은 이전 BE 기준이며 Notion의 { code, name } 계약과 다르다.
  const dto = await clientFetch<unknown>("/api/products/subcategories", {
    auth: false,
    signal,
  });
  return mapProductCrafts(productCraftsDto.parse(dto));
}
