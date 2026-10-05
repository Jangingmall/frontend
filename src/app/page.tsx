import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import {
  fetchHomeDemoArtisans,
  fetchHomeDemoBest,
  fetchHomeDemoGifts,
  fetchHomeDemoPromotions,
} from "@/api/home/demo-server";
import { fetchProductCatalogue as fetchProductList } from "@/api/products/catalogue-server";
import { getQueryClient } from "@/lib/query/server";
import { homeKeys } from "@/queries/home/keys";
import { GIFT_THEMES } from "@/types/gift-theme";

import { ArtisanCarousel } from "./_components/ArtisanCarousel";
import { GiftSection } from "./_components/GiftSection";
import { HeroBanner } from "./_components/HeroBanner";
import { ProductCarouselSection } from "./_components/ProductCarouselSection";
import { PromotionSection } from "./_components/PromotionSection";
import { SiteFloatingActions } from "./site-floating-actions";

const INITIAL_GIFT_THEME = GIFT_THEMES[0].id;

/** 홈 선물·장인관은 MSW 시연 자료를 사용하고, 선물의 최초 결과는 홈 전용 키로 hydrate한다. */
export default async function HomePage() {
  const artisans = await fetchHomeDemoArtisans().catch(() => []);
  const queryClient = getQueryClient();

  const [bestProducts, newProducts, promotions] = await Promise.all([
    fetchHomeDemoBest().catch(() => undefined),
    fetchProductList({ sort: "newest", size: 4 }).catch(() => undefined),
    fetchHomeDemoPromotions().catch((error: unknown) => {
      console.error("홈 기획전 시연 데이터를 불러오지 못했습니다.", error);
      return [];
    }),
    queryClient.prefetchQuery({
      queryKey: homeKeys.gifts(INITIAL_GIFT_THEME),
      queryFn: () => fetchHomeDemoGifts(INITIAL_GIFT_THEME),
    }),
  ]);

  return (
    <>
      <HeroBanner />
      <ProductCarouselSection
        title="베스트"
        description="장인의 손길이 담긴 추천 작품"
        viewAllPreset="best"
        columns={5}
        data={bestProducts}
        interactiveProductIds={[900002]}
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <GiftSection initialTheme={INITIAL_GIFT_THEME} />
      </HydrationBoundary>
      <ArtisanCarousel items={artisans} />
      <ProductCarouselSection
        title="신상품"
        description="새롭게 만나는 장인과 작품의 이야기"
        viewAllPreset="new"
        columns={4}
        data={newProducts}
      />
      <PromotionSection items={promotions} />

      <SiteFloatingActions />
    </>
  );
}
