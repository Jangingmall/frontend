import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { fetchProductList } from "@/api/products/api";
import { FloatingActions } from "@/components/common/floating-actions";
import { getQueryClient } from "@/lib/query/server";
import { productKeys } from "@/queries/products/keys";
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
 * 베스트·신상품은 `ProductCarouselSection`이 순수 프레젠테이션(클라이언트 재조회 없음)이라
 * 서버에서 미리 조회해 `data` prop으로 바로 넘긴다 — Query 캐시를 거칠 이유가 없다(구독하는
 * 클라이언트 훅이 없으면 prefetch+hydrate는 얻는 게 없다). 실패는 `.catch(() => undefined)`로
 * 흡수하고 해당 섹션은 렌더링하지 않는다 — 홈은 비핵심 마케팅 화면이라 ErrorState로 막지
 * 않는다(design.md §2).
 *
 * 선물은 다르다 — `GiftSection`이 테마를 바꿀 때마다 `useProductList`(TanStack Query 훅)로
 * 클라이언트에서 재조회한다. 이 경우 서버 fetch 결과를 `initialData` prop으로 손수 넘기고
 * "지금 선택된 테마가 초기 테마와 같을 때만 쓴다"는 매칭 로직을 컴포넌트가 직접 가져야 했는데
 * (이전 구현), `queryClient.prefetchQuery()` + `dehydrate()` + `HydrationBoundary`로 같은
 * `productKeys.list(...)` 캐시 키에 정식으로 채워 넣으면 그 매칭 로직 없이도 `useProductList`가
 * 같은 키를 자동으로 찾아 쓴다 — TanStack Query가 SSR 데이터를 다루는 정석 패턴이다
 * (`lib/query/server.ts`). ISR 캐시 태그·재검증은 이 호출 방식과 무관하게 `fetchProductList`
 * 자체(`api/products/api.ts`)가 담당한다(docs/isr.md §2).
 *
 * `FloatingActions`(CM-5 맨 위로·AI 챗봇)는 IA상 이 화면에만 있는 게 아니라 PL-1·
 * PL-2·PL-3에도 떠야 해서 `components/common/`에 공용으로 두고 여기서 개별 연결한다
 * (그 화면들은 아직 미착수 — 착수 시 같은 import만 추가하면 됨).
 */
export default async function HomePage() {
  const queryClient = getQueryClient();
  const giftQuery = { giftTheme: INITIAL_GIFT_THEME, size: 3 };

  const [bestProducts, newProducts] = await Promise.all([
    fetchProductList({ sort: "sales", size: 5 }).catch(() => undefined),
    fetchProductList({ sort: "newest", size: 4 }).catch(() => undefined),
    queryClient.prefetchQuery({
      queryKey: productKeys.list(giftQuery),
      queryFn: () => fetchProductList(giftQuery),
    }),
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
      <HydrationBoundary state={dehydrate(queryClient)}>
        <GiftSection initialTheme={INITIAL_GIFT_THEME} />
      </HydrationBoundary>
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
