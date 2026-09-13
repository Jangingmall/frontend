import { seedImageRef } from "@/mocks/seed";
import type { ProductSummary } from "@/types/product";

/**
 * 홈 "기획전" 섹션 더미 상품 4건. IA 명시대로 실제 API 연동 없이 노출만 한다
 * (design.md §0.2 "기획전"). `ProductSummary` 형태를 그대로 채워 `ProductCard`를
 * 그대로 재사용할 수 있게 한다 — 카드·전체보기 클릭 비활성은 `PromotionSection`이
 * `inert`로 처리한다(§3 "구현 후 재검증" 참고).
 */
export const PROMOTION_PRODUCTS: readonly ProductSummary[] = [
  {
    id: -1,
    name: "무명 행주 3매 세트",
    price: 12000,
    thumbnail: seedImageRef(9001),
    artisan: { id: -1, name: "정직조" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
  {
    id: -2,
    name: "대나무 수저받침",
    price: 8000,
    thumbnail: seedImageRef(9002),
    artisan: { id: -2, name: "박죽공" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
  {
    id: -3,
    name: "옹기 양념 종지",
    price: 15000,
    thumbnail: seedImageRef(9003),
    artisan: { id: -3, name: "김옹기" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
  {
    id: -4,
    name: "삼베 컵받침 세트",
    price: 9000,
    thumbnail: seedImageRef(9004),
    artisan: { id: -4, name: "이방직" },
    craftCategory: null,
    rating: null,
    reviewCount: 0,
    primaryBadge: null,
    isSoldOut: false,
  },
];
