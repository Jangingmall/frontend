import type { ProductListQuery } from "@/api/products/query";
import { PRODUCT_LIST_SORT, type ProductListSort } from "@/types/sort";

function parsePrice(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const price = Number(value);
  return Number.isSafeInteger(price) && price >= 0 ? price : undefined;
}

export function parseProductSearchParams(
  params: URLSearchParams,
): ProductListQuery {
  const page = Number(params.get("page"));
  const sort = params.get("sort") ?? "popular";
  let minPrice = parsePrice(params.get("minPrice"));
  let maxPrice = parsePrice(params.get("maxPrice"));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    size: 20,
    sort: Object.hasOwn(PRODUCT_LIST_SORT, sort)
      ? (sort as ProductListSort)
      : "popular",
    category: params.get("category") || undefined,
    keyword: params.get("keyword") || undefined,
    materials: [...new Set(params.getAll("material").filter(Boolean))].sort(),
    minPrice,
    maxPrice,
    hasGiftWrap: params.get("hasGiftWrap") === "true",
    excludeSoldOut: params.get("excludeSoldOut") === "true",
  };
}

export function updateProductSearchParams(
  current: URLSearchParams,
  patch: Partial<ProductListQuery>,
): URLSearchParams {
  const params = new URLSearchParams(current);
  if (!("page" in patch)) params.delete("page");
  for (const [key, value] of Object.entries(patch)) {
    if (key === "size") continue;
    const param = key === "materials" ? "material" : key;
    params.delete(param);
    if (Array.isArray(value)) {
      for (const item of [...new Set(value)].sort()) params.append(param, item);
    } else if (
      value !== undefined &&
      value !== false &&
      value !== "" &&
      !(key === "page" && value === 1)
    ) {
      params.set(param, String(value));
    }
  }
  return params;
}
