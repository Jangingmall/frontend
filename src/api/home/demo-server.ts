import "server-only";

import { getResponse } from "msw";
import { z } from "zod";

import { fetchDemoProductList } from "@/api/products/demo-catalogue";
import { resolveResponse } from "@/lib/http/response";
import { readDemoCatalogue } from "@/mocks/catalogue-server";
import { extensionHandlers } from "@/mocks/extensions";
import type { GiftThemeId } from "@/types/gift-theme";

import { carouselItem } from "./api";

export function fetchHomeDemoGifts(theme: GiftThemeId) {
  return fetchDemoProductList(
    { giftTheme: theme, size: 3 },
    [],
    readDemoCatalogue,
  );
}

/** 홈에서만 서버 MSW를 직접 실행해 빌드·첫 렌더링이 실제 장인 API에 의존하지 않게 한다. */
export async function fetchHomeDemoArtisans() {
  const response = await getResponse(
    extensionHandlers,
    new Request("http://msw.local/api/mock/home/artisans"),
  );
  if (!response) throw new Error("홈 장인관 시연 응답이 없습니다.");
  return z.array(carouselItem).parse(await resolveResponse(response));
}
