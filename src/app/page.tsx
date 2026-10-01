import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import {
  fetchHomeDemoArtisans,
  fetchHomeDemoGifts,
} from "@/api/home/demo-server";
import { fetchProductCatalogue as fetchProductList } from "@/api/products/catalogue-server";
import { publicEnv } from "@/lib/env";
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
    fetchProductList({ sort: "sales", size: 5 }).catch(() => undefined),
    fetchProductList({ sort: "newest", size: 4 }).catch(() => undefined),
    fetchProductList({ sort: "wishlist", size: 4 }).catch(() => undefined),
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
        description={
          publicEnv.apiMocking ? "최근 4주 판매·조회 기준" : "베스트 상품 시연"
        }
        viewAllPreset="best"
        columns={5}
        data={bestProducts}
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
      <div>
        {!publicEnv.apiMocking && (
          <p className="text-center text-body-s">기획전 시연</p>
        )}
        <PromotionSection items={promotions?.items ?? []} />
      </div>

      <SiteFloatingActions />
    </>
  );
}
