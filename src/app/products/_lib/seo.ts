import { parseProductSearchParams } from "./search-params";

export function getProductSeo(
  params: Record<string, string | string[] | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else if (value !== undefined) search.set(key, value);
  }
  const query = parseProductSearchParams(search);
  const hasFilters = Boolean(
    query.materials?.length ||
    query.keyword ||
    query.hasGiftWrap ||
    query.excludeSoldOut ||
    (query.minPrice !== undefined && query.minPrice > 0) ||
    query.maxPrice !== undefined ||
    query.sort !== "popular",
  );
  // 번호 페이지도 대표 카테고리 canonical을 유지한다. page 자체는 필터가 아니다.
  const canonical = query.category
    ? `/products?category=${encodeURIComponent(query.category)}`
    : "/products";
  return { canonical, hasFilters };
}
