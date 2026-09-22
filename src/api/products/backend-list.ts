import { ApiError } from "@/lib/http/api-error";
import type { ProductCategory } from "@/types/product-filter";

import {
  mapBackendProductList,
  resolveProductCategoryCode,
} from "./backend-mapper";
import { backendProductListDto } from "./backend-validation";
import {
  type ProductListQuery,
  resolveProductListPaging,
  toProductListSearchParams,
} from "./query";
export async function fetchBackendProductList(
  query: ProductListQuery,
  fetchPage: (path: string) => Promise<unknown>,
  fetchCategories: () => Promise<ProductCategory[]>,
) {
  const { page, size } = resolveProductListPaging(query);
  const category = query.category
    ? resolveProductCategoryCode(query.category, await fetchCategories())
    : undefined;
  const params = toProductListSearchParams(query);
  if (category)
    params.set(
      query.category?.startsWith("subcategory-")
        ? "subcategoryId"
        : "categoryId",
      category,
    );
  const dto = backendProductListDto.parse(
    await fetchPage(`/api/products?${params}`),
  );
  if (
    dto.number !== page - 1 ||
    dto.size !== size ||
    dto.totalPages !== Math.ceil(dto.totalElements / dto.size) ||
    dto.content.length !==
      Math.max(
        0,
        Math.min(dto.size, dto.totalElements - dto.number * dto.size),
      ) ||
    new Set(dto.content.map((item) => item.productId)).size !==
      dto.content.length
  ) {
    throw new ApiError(502, { errorCode: "PRODUCT_LIST_INCOMPLETE" });
  }
  return mapBackendProductList(dto);
}
