/**
 * 도메인 배지 값 → 한글 라벨. (Figma `[FE] Components / Badge`, docs/api-contract.md §5)
 *
 * 배지 UI(`components/ui/badge.tsx`)는 라벨별 색 차이가 없어 상수맵을 두지 않는다.
 * 여기서 다루는 건 "도메인 값 → 표시 문구"뿐이다. 지금은 상품 대표 배지만.
 * 주문 상태 배지·장인 배지는 각 도메인 작업에서 같은 형태로 추가한다.
 */

/**
 * 상품 대표 배지(`primaryBadge`). 서버가 한정수량 > 신작 > 인기 우선순위로 하나만 계산한다.
 * BE enum 문자열값이 미확정이라 아래는 가정이다. 확정 시 키만 교체하면 되고,
 * {@link productBadgeLabel}이 unknown-safe라 그 사이에도 화면은 깨지지 않는다.
 */
export const PRODUCT_BADGE = {
  LIMITED: "LIMITED",
  NEW: "NEW",
  POPULAR: "POPULAR",
} as const;

export type ProductBadge = (typeof PRODUCT_BADGE)[keyof typeof PRODUCT_BADGE];

const PRODUCT_BADGE_LABEL: Record<ProductBadge, string> = {
  LIMITED: "한정수량",
  NEW: "신작",
  POPULAR: "인기",
};

/** 매핑이 없으면 `undefined`를 돌려준다(호출측이 미표시 처리). */
export function productBadgeLabel(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return PRODUCT_BADGE_LABEL[value as ProductBadge];
}
