/**
 * ISR cache tag 팩토리. (docs/isr.md §3 태그 계약)
 *
 * 태그 문자열은 이 한 곳에서만 생성한다. 재검증 웹훅(`lib/isr/revalidation.ts`)과 서버 데이터
 * 조회 함수(`api/{domain}/`)가 이 팩토리를 공유해, 두 쪽이 각자 문자열을 하드코딩하다 어긋나는
 * 걸 막는다.
 */
export const isrTags = {
  /** 모든 공개 상품 목록·검색·필터 결과. page 번호와 무관한 공통 컬렉션 태그 */
  productList: () => "products",
  /** 상품 상세 */
  product: (productId: number) => `product:${productId}`,
  /** 상품 상세에 포함된 장인 소개 요약 */
  productArtisan: () => "product-artisan",
  /** 필터 옵션 목록(`/categories`, `/materials`). 트리거 이벤트가 없어 time-based로만 갱신 */
  productTaxonomy: () => "product-taxonomy",
  /** 공개 장인 목록 */
  artisanList: () => "artisans",
  /** 장인 상세 */
  artisan: (artisanId: number) => `artisan:${artisanId}`,
} as const;
