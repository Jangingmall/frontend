import "server-only";

import { cache } from "react";

import { publicEnv } from "@/lib/env";
import { ApiError, fetchPublicApi } from "@/lib/http/fetcher";
import { isrTags } from "@/lib/isr/tags";

import { mapProductDetail, mapProductDetailMock } from "./detail-mapper";
import { productDetailDto, productDetailMockDto } from "./detail-validation";

/** metadata와 page의 동일 조회를 한 렌더에서 공유한다. 사용자 데이터는 포함하지 않는다. */
export const fetchProductDetail = cache(async (productId: number) => {
  let raw: unknown;
  try {
    raw = await fetchPublicApi<unknown>(`/api/products/${productId}`, {
      tags: [isrTags.product(productId), isrTags.productArtisan()],
      revalidate: 3600,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
  return publicEnv.apiMocking
    ? mapProductDetailMock(productDetailMockDto.parse(raw))
    : mapProductDetail(productDetailDto.parse(raw));
});
