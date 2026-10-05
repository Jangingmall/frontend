import type { ProductSummary } from "@/types/product";

function createHomeProduct(
  id: number,
  name: string,
  artisan: string,
  price: number,
  rating: number | null,
  image: string,
  colors: string[],
): ProductSummary {
  return {
    id,
    isDemo: true,
    name,
    price,
    thumbnail: null,
    thumbnailUrl: image,
    artisan: { id, name: artisan },
    craftCategory: null,
    rating,
    reviewCount: null,
    primaryBadge: null,
    isSoldOut: false,
    colors: colors.map((hex) => ({ name: hex, hex })),
  };
}

/** 홈 베스트 프론트 MSW 상품 목록. */
export const HOME_BEST_PRODUCTS: ProductSummary[] = [
  createHomeProduct(
    9501,
    "전통 한지 무드등",
    "이한지",
    68000,
    4.9,
    "/home-products/traditional-hanji-lamp.jpg",
    ["#E4A86F"],
  ),
  createHomeProduct(
    9502,
    "옥 매듭 반지",
    "김옥장",
    400000,
    4.8,
    "/home-products/jade-knot-ring.jpg",
    ["#AEBEB5"],
  ),
  createHomeProduct(
    9503,
    "옻칠 원형 쟁반",
    "이옻칠",
    95000,
    5,
    "/home-products/lacquered-tray.jpg",
    ["#6D372D", "#121B29"],
  ),
  createHomeProduct(
    900002,
    "청자 분청 찻잔",
    "이청청",
    120000,
    4.9,
    "/home-products/celadon-teacup.png",
    ["#A9C3BA"],
  ),
  createHomeProduct(
    9505,
    "왕골 원형 부채",
    "조왕골",
    22000,
    4.8,
    "/home-products/rush-fan.jpg",
    ["#E8CEAD", "#8E7A53"],
  ),
];

/** 홈 기획전 전용 프론트 MSW 상품 목록. */
export const HOME_PROMOTION_PRODUCTS: ProductSummary[] = [
  createHomeProduct(
    9601,
    "대나무 조명",
    "김조명",
    500000,
    null,
    "/home-products/promotion-bamboo-lamp.jpg",
    ["#C18B4C"],
  ),
  createHomeProduct(
    9602,
    "백잔",
    "이백잔",
    100000,
    null,
    "/home-products/promotion-white-cup.jpg",
    ["#FFFFFF"],
  ),
  createHomeProduct(
    9603,
    "오배자염 테이블러너",
    "오자염",
    140000,
    null,
    "/home-products/promotion-table-runner.jpg",
    ["#9A8D8B", "#A86062", "#648570"],
  ),
  createHomeProduct(
    9604,
    "산수화 대형 부채",
    "임산수",
    85000,
    null,
    "/home-products/promotion-landscape-fan.jpg",
    ["#DCD6C5", "#FFFFFD"],
  ),
];
