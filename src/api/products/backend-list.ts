import { ApiError } from "@/lib/http/api-error";
import { toGiftThemeApi } from "@/types/gift-theme";
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
  const keyword = query.keyword?.trim().toLocaleLowerCase();
  const filtered = Boolean(
    category ||
    keyword ||
    query.giftTheme ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined,
  );
  const read = async (p: number, s: number) =>
    backendProductListDto.parse(
      await fetchPage(
        `/api/products?${toProductListSearchParams({ ...query, page: p, size: s })}`,
      ),
    );
  if (!filtered) {
    const dto = await read(page, size);
    if (
      dto.number !== page - 1 ||
      dto.size !== size ||
      dto.totalPages !== Math.ceil(dto.totalElements / dto.size) ||
      dto.content.length !==
        Math.max(
          0,
          Math.min(dto.size, dto.totalElements - dto.number * dto.size),
        )
    )
      throw new ApiError(502, { errorCode: "PRODUCT_LIST_INCOMPLETE" });
    return mapBackendProductList(dto);
  }
  const first = await read(1, 100);
  const items = [...first.content];
  const invalid = () => {
    throw new ApiError(502, { errorCode: "PRODUCT_LIST_INCOMPLETE" });
  };
  if (
    first.number !== 0 ||
    first.totalPages !== Math.ceil(first.totalElements / first.size) ||
    first.content.length !== Math.min(first.size, first.totalElements)
  )
    invalid();
  for (let index = 1; index < first.totalPages; index++) {
    const next = await read(index + 1, first.size);
    if (
      next.number !== index ||
      next.size !== first.size ||
      next.totalElements !== first.totalElements ||
      next.totalPages !== first.totalPages ||
      next.content.length !==
        Math.min(first.size, first.totalElements - index * first.size)
    )
      invalid();
    items.push(...next.content);
  }
  if (
    items.length !== first.totalElements ||
    new Set(items.map((p) => p.productId)).size !== items.length
  )
    invalid();
  const selected = items.filter(
    (p) =>
      (!category ||
        (query.category?.startsWith("subcategory-")
          ? p.subcategoryId
          : p.categoryId) === Number(category)) &&
      (!keyword ||
        `${p.title} ${p.description ?? ""}`
          .toLocaleLowerCase()
          .includes(keyword)) &&
      (query.minPrice === undefined || p.price >= query.minPrice) &&
      (query.maxPrice === undefined || p.price <= query.maxPrice) &&
      (!query.giftTheme ||
        p.giftThemes.includes(toGiftThemeApi(query.giftTheme))),
  );
  // 인기순은 서버가 반환한 순위를 필터링·페이지 분할 후에도 유지한다.
  if (query.sort !== "popular")
    selected.sort(
      (a, b) =>
        (query.sort === "price-asc"
          ? a.price - b.price
          : query.sort === "price-desc"
            ? b.price - a.price
            : b.createdAt.localeCompare(a.createdAt)) ||
        a.productId - b.productId,
    );
  return mapBackendProductList({
    ...first,
    content: selected.slice((page - 1) * size, page * size),
    number: page - 1,
    size,
    totalElements: selected.length,
    totalPages: Math.ceil(selected.length / size),
  });
}
