/**
 * 홈 "기획전" 섹션 더미 상품 4건. IA 명시대로 실제 API 연동 없이 노출만 하고
 * 카드·전체보기 클릭은 비활성이다(design.md §0.2 "기획전").
 */
export interface PromotionProduct {
  id: string;
  name: string;
  /** 원(KRW) 정수 금액. */
  price: number;
}

export const PROMOTION_PRODUCTS: readonly PromotionProduct[] = [
  { id: "promotion-1", name: "무명 행주 3매 세트", price: 12000 },
  { id: "promotion-2", name: "대나무 수저받침", price: 8000 },
  { id: "promotion-3", name: "옹기 양념 종지", price: 15000 },
  { id: "promotion-4", name: "삼베 컵받침 세트", price: 9000 },
];
