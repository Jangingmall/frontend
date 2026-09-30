/**
 * 상품 목록 화면의 껍데기 클래스. 실제 화면(`ProductListPage`), 좌측 필터(`ProductFilters`),
 * 로딩 스켈레톤(`ProductListSkeleton`)이 같은 값을 써서 로딩→본문 전환의 layout shift를 막는다.
 */

/** `<main>`: 좌우 마진 `page-gutter`, 상단 mobile 48 / md 64, 하단 여백 84 / md 160 / lg 200 */
export const PRODUCT_LIST_MAIN_CLASS =
  "mx-auto w-full max-w-desktop page-gutter pt-12 pb-21 md:pt-16 md:pb-40 lg:pb-50";

/** 좌측 필터 폭: lg 164 / xl 177 / 2xl 204 (lg 미만은 사이드바 없이 시트) */
export const PRODUCT_FILTER_WIDTH_CLASS =
  "lg:w-41 lg:shrink-0 xl:w-44.25 2xl:w-51";
