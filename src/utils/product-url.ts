/** 카드와 상세 route가 공유하는 공개 주소. 한글 상품명도 한 세그먼트로 인코딩한다. */
export function getProductPath(product: { id: number; name: string }) {
  const slug = product.name.trim().replace(/\s+/g, "-") || "product";
  return `/products/${encodeURIComponent(slug)}-${product.id}`;
}

export function parseProductId(segment: string): number | null {
  const match = /^([^/]+)-([1-9]\d*)$/.exec(segment);
  if (!match || !match[1].replace(/-/g, "").trim()) return null;
  const id = Number(match[2]);
  return Number.isSafeInteger(id) ? id : null;
}

/** Next 16의 RSC params가 percent-encoded인 경로도 동일 주소로 취급한다. */
export function isCanonicalProductSlug(
  product: { id: number; name: string },
  segment: string,
) {
  const encoded = getProductPath(product).slice("/products/".length);
  return segment === encoded || segment === decodeURIComponent(encoded);
}
