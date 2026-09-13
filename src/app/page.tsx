import { fetchProductList } from "@/api/products/api";
import { FloatingActions } from "@/components/common/floating-actions";
import { GIFT_THEMES } from "@/types/gift-theme";

import { ArtisanCarousel } from "./_components/ArtisanCarousel";
import { GiftSection } from "./_components/GiftSection";
import { HeroBanner } from "./_components/HeroBanner";
import { ProductCarouselSection } from "./_components/ProductCarouselSection";
import { PromotionSection } from "./_components/PromotionSection";

const INITIAL_GIFT_THEME = GIFT_THEMES[0].id;

/**
 * 홈 `/`(HO-1). 섹션 순서는 Figma 실측 y좌표로 확인한 순서 그대로다(design.md §0.1):
 * 헤더(layout) → 히어로 → 베스트 → 선물 → 장인관 → 신상품 → 기획전 → 푸터(layout).
 *
 * 베스트·신상품·선물(초기 테마)은 서버에서 미리 조회해 첫 페인트를 채운다. 실패는
 * `.catch(() => undefined)`로 흡수하고 해당 섹션은 렌더링하지 않는다 — 홈은 비핵심
 * 마케팅 화면이라 ErrorState로 막지 않는다(design.md §2).
 *
 * `FloatingActions`(CM-5 맨 위로·AI 챗봇)는 IA상 이 화면에만 있는 게 아니라 PL-1·
 * PL-2·PL-3에도 떠야 해서 `components/common/`에 공용으로 두고 여기서 개별 연결한다
 * (그 화면들은 아직 미착수 — 착수 시 같은 import만 추가하면 됨).
 */
export default async function HomePage() {
  const [bestProducts, newProducts, giftProducts] = await Promise.all([
    fetchProductList({ sort: "sales", size: 5 }).catch(() => undefined),
    fetchProductList({ sort: "newest", size: 4 }).catch(() => undefined),
    fetchProductList({ giftTheme: INITIAL_GIFT_THEME, size: 3 }).catch(
      () => undefined,
    ),
  ]);

  return (
    <>
      <HeroBanner />
      <ProductCarouselSection
        title="베스트"
        description="최근 4주 판매·조회 기준"
        viewAllPreset="best"
        columns={5}
        data={bestProducts}
      />
      <GiftSection
        initialTheme={INITIAL_GIFT_THEME}
        initialData={giftProducts}
      />
      <ArtisanCarousel />
      <ProductCarouselSection
        title="신상품"
        description="새롭게 만나는 장인과 작품의 이야기"
        viewAllPreset="new"
        columns={4}
        data={newProducts}
      />
      <PromotionSection />
      <FloatingActions />
    </>
  );
}
