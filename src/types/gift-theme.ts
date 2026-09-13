/**
 * 선물 테마 8종. (docs/api-contract.md §5 `giftTheme` 필터)
 * URL·화면·쿼리가 함께 쓰는 공유 타입이라 `types/sort.ts`와 같은 자리에 둔다.
 *
 * API 코드값은 BE·PM이 아직 확정하지 않았다(docs/api-contract.md §9 "PM 확정" 대기,
 * 예시 `HOUSEWARMING`). 아래는 그 사이 쓰는 임시값 — 확정되면 {@link GIFT_THEME_API}만
 * 고치면 되고, FE id·라벨·나머지 코드는 그대로 둔다.
 */

export type GiftThemeId =
  | "housewarming"
  | "milestone-birthday"
  | "wedding"
  | "business"
  | "parents"
  | "friend"
  | "promotion"
  | "corporate";

export type GiftThemeApi =
  | "HOUSEWARMING"
  | "MILESTONE_BIRTHDAY"
  | "WEDDING"
  | "BUSINESS"
  | "PARENTS"
  | "FRIEND"
  | "PROMOTION"
  | "CORPORATE";

export interface GiftThemeOption {
  id: GiftThemeId;
  label: string;
}

/** 화면에 노출하는 순서 그대로(Figma `Gift options container` 순서). */
export const GIFT_THEMES: readonly GiftThemeOption[] = [
  { id: "housewarming", label: "집들이 · 이사" },
  { id: "milestone-birthday", label: "돌 · 환갑" },
  { id: "wedding", label: "웨딩 · 혼수" },
  { id: "business", label: "상사 · 거래처" },
  { id: "parents", label: "부모님 · 어른" },
  { id: "friend", label: "친구 · 동료" },
  { id: "promotion", label: "승진 · 감사" },
  { id: "corporate", label: "기업 · 단체 답례품" },
];

const GIFT_THEME_API: Record<GiftThemeId, GiftThemeApi> = {
  housewarming: "HOUSEWARMING",
  "milestone-birthday": "MILESTONE_BIRTHDAY",
  wedding: "WEDDING",
  business: "BUSINESS",
  parents: "PARENTS",
  friend: "FRIEND",
  promotion: "PROMOTION",
  corporate: "CORPORATE",
};

export function toGiftThemeApi(id: GiftThemeId): GiftThemeApi {
  return GIFT_THEME_API[id];
}
