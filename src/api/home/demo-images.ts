import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

/** 각 선물 테마의 첫 세 상품에만 생성 이미지를 적용해 공용 카탈로그 원본을 보존한다. */
export function withHomeGiftImages(
  page: Page<ProductSummary>,
): Page<ProductSummary> {
  return {
    ...page,
    items: page.items.map((item) =>
      item.id >= 101 && item.id <= 124
        ? {
            ...item,
            thumbnail: null,
            thumbnailUrl: `/images/home-demo/gift-${item.id}.webp`,
          }
        : item,
    ),
  };
}

export const HOME_ARTISAN_IMAGES: Record<string, { src: string; alt: string }> =
  {
    "artisan-1": {
      src: "/images/home-demo/artisan-1.webp",
      alt: "물레에서 도자기를 빚는 가상 도예 장인",
    },
    "artisan-2": {
      src: "/images/home-demo/artisan-2.webp",
      alt: "나무 그릇에 옻칠하는 가상 장인",
    },
    "artisan-3": {
      src: "/images/home-demo/artisan-3.webp",
      alt: "대장간에서 쇠를 두드리는 가상 장인",
    },
    "artisan-4": {
      src: "/images/home-demo/artisan-4.webp",
      alt: "베틀에서 삼베를 짜는 가상 장인",
    },
    "artisan-5": {
      src: "/images/home-demo/artisan-5.webp",
      alt: "전통 방식으로 한지를 뜨는 가상 장인",
    },
    "artisan-6": {
      src: "/images/home-demo/artisan-6.webp",
      alt: "공방에서 나무를 다듬는 가상 목공 장인",
    },
  };
