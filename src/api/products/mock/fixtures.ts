import type { ProductListResponseDto } from "@/api/products/validation";

/**
 * `GET /api/products` mock 데이터. 실제 검증 스키마(`productListResponseDto`)로 테스트에서
 * 검증해 mock ↔ 계약 일치를 보장한다. (docs/data-layer.md §4.3)
 */

function image(id: string) {
  return {
    imageId: id,
    variants: [
      {
        width: 320 as const,
        url: `https://cdn.example.com/${id}/320.webp`,
        format: "webp" as const,
      },
      {
        width: 640 as const,
        url: `https://cdn.example.com/${id}/640.webp`,
        format: "webp" as const,
      },
      {
        width: 1280 as const,
        url: `https://cdn.example.com/${id}/1280.webp`,
        format: "webp" as const,
      },
    ],
  };
}

export const productListPage1: ProductListResponseDto = {
  items: [
    {
      id: 101,
      name: "백자 달항아리",
      price: 320000,
      thumbnail: image("image_01HXP1"),
      artisan: { id: 11, name: "김도예" },
      craftCategory: "사기장",
      rating: 4.8,
      reviewCount: 27,
      primaryBadge: "LIMITED",
      status: "ON_SALE",
    },
    {
      id: 102,
      name: "옻칠 3단 찬합",
      price: 189000,
      thumbnail: image("image_01HXP2"),
      artisan: { id: 12, name: "이나전" },
      craftCategory: "칠장",
      rating: null,
      reviewCount: 0,
      primaryBadge: "NEW",
      status: "ON_SALE",
    },
    {
      id: 103,
      name: "유기 반상기 세트",
      price: 450000,
      thumbnail: image("image_01HXP3"),
      artisan: { id: 13, name: "박유기" },
      craftCategory: "유기장",
      rating: 4.5,
      reviewCount: 8,
      primaryBadge: null,
      status: "SOLD_OUT",
    },
  ],
  totalCount: 3,
};

export const productListEmpty: ProductListResponseDto = {
  items: [],
  totalCount: 0,
};
