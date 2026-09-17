import "server-only";

import { cache } from "react";

import { publicEnv } from "@/lib/env";
import { ApiError, fetchPublicApi } from "@/lib/http/fetcher";
import { isrTags } from "@/lib/isr/tags";

import { mapProductDetail, mapProductDetailMock } from "./detail-mapper";
import {
  productArtisanDto,
  productDetailDto,
  productDetailMockDto,
} from "./detail-validation";

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
  if (publicEnv.apiMocking)
    return mapProductDetailMock(productDetailMockDto.parse(raw));
  const dto = productDetailDto.parse(raw);
  const product = mapProductDetail(dto);
  if (!product) return null;
  // 공개 장인 요약은 기존 별도 조회로 보완한다. 요약 실패가 기본 상품을 막지 않는다.
  try {
    const artisan = productArtisanDto.parse(
      await fetchPublicApi(`/api/member/artisans/${dto.artisanId}`, {
        tags: [isrTags.artisan(dto.artisanId), isrTags.productArtisan()],
        revalidate: 3600,
      }),
    );
    if (artisan.artisanId === dto.artisanId)
      product.artisan = {
        id: artisan.artisanId,
        name: artisan.businessName,
        image: artisan.profileImageUrl
          ? { src: artisan.profileImageUrl, alt: artisan.businessName }
          : null,
        stage: "",
        craft: artisan.category ?? "",
        introduction: artisan.introduction ?? "",
        href: null,
      };
  } catch {
    // 미제공/일시 오류이면 장인 영역을 숨기고 상품은 유지한다.
  }
  return product;
});
