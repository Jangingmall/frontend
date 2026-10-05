import "server-only";

import { getResponse } from "msw";
import { z } from "zod";

import { fetchDemoProductList } from "@/api/products/demo-catalogue";
import { resolveResponse } from "@/lib/http/response";
import { readDemoCatalogue } from "@/mocks/catalogue-server";
import { extensionHandlers } from "@/mocks/extensions";
import type { Page } from "@/types/api";
import type { GiftThemeId } from "@/types/gift-theme";
import type { ProductSummary } from "@/types/product";

import { carouselItem } from "./api";
import { HOME_ARTISAN_IMAGES, withHomeGiftImages } from "./demo-images";
import { homeHandlers } from "./mock/handlers";
import { homeProductSummarySchema } from "./validation";

export function fetchHomeDemoGifts(theme: GiftThemeId) {
  return fetchDemoProductList(
    { giftTheme: theme, size: 3 },
    [],
    readDemoCatalogue,
  ).then(withHomeGiftImages);
}

async function fetchHomeMockProducts(
  section: "best" | "promotions",
): Promise<ProductSummary[]> {
  // 정적 빌드에서는 instrumentation의 전역 resolver가 아직 준비되지 않을 수 있다.
  const response = await getResponse(
    homeHandlers,
    new Request(`http://msw.local/api/mock/home/${section}`),
  );
  if (!response) throw new Error("홈 상품 시연 응답이 없습니다.");
  return z
    .array(homeProductSummarySchema)
    .parse(await resolveResponse(response));
}

/** 홈 베스트는 공개 상품 API 대신 프론트 MSW 상품 목록을 사용한다. */
export async function fetchHomeDemoBest(): Promise<Page<ProductSummary>> {
  const items = await fetchHomeMockProducts("best");
  return {
    items,
    page: 1,
    pageSize: items.length,
    totalCount: items.length,
    totalPages: items.length ? 1 : 0,
  };
}

/** 홈 기획전은 공개 상품 API 대신 프론트 MSW 상품 목록을 사용한다. */
export function fetchHomeDemoPromotions() {
  return fetchHomeMockProducts("promotions");
}

/** 홈에서만 서버 MSW를 직접 실행해 빌드·첫 렌더링이 실제 장인 API에 의존하지 않게 한다. */
export async function fetchHomeDemoArtisans() {
  const response = await getResponse(
    extensionHandlers,
    new Request("http://msw.local/api/mock/home/artisans"),
  );
  if (!response) throw new Error("홈 장인관 시연 응답이 없습니다.");
  return z
    .array(carouselItem)
    .parse(await resolveResponse(response))
    .map((item) => ({ ...item, image: HOME_ARTISAN_IMAGES[item.id] }));
}
