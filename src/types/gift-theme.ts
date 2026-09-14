/**
 * 선물 테마 8종. (docs/api-contract.md §5 `giftTheme` 필터)
 * URL·화면·쿼리가 함께 쓰는 공유 타입이라 `types/sort.ts`와 같은 자리에 둔다.
 *
 * API 코드값은 BE·PM이 아직 확정하지 않았다(docs/api-contract.md §9 "PM 확정" 대기).
 * 그래도 BE 레포 `docs/장인몰_API_계약서_공개조회.md`(giftTheme enum)에 지금 실제로 구현된
 * 임시값과는 맞춰둔다 — FE가 따로 지어낸 값(`MILESTONE_BIRTHDAY`, `BUSINESS`)이 BE의
 * `BIRTHDAY_60TH`, `BOSS`와 어긋나 있던 걸 CodeRabbit 리뷰로 발견해 바로잡았다. PM이 최종
 * 확정하면 {@link GIFT_THEME_API}만 다시 고치면 되고, FE id·라벨은 그대로 둔다.
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
  | "BIRTHDAY_60TH"
  | "WEDDING"
  | "BOSS"
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
  "milestone-birthday": "BIRTHDAY_60TH",
  wedding: "WEDDING",
  business: "BOSS",
  parents: "PARENTS",
  friend: "FRIEND",
  promotion: "PROMOTION",
  corporate: "CORPORATE",
};

export function toGiftThemeApi(id: GiftThemeId): GiftThemeApi {
  return GIFT_THEME_API[id];
}
