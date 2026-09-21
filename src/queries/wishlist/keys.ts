export const wishlistKeys = {
  all: ["wishlist"] as const,
  list: (page: number) => [...wishlistKeys.all, "list", page] as const,
  /** 최근 본 상품 화면의 카드별 하트 상태용 — 찜한 상품 id 전체 집합. */
  wishedIds: () => [...wishlistKeys.all, "wishedIds"] as const,
};
