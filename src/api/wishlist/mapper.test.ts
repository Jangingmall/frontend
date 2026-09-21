import { describe, expect, it } from "vitest";

import { mapWishlistPage } from "./mapper";
import type { WishlistPageDto } from "./validation";

describe("mapWishlistPage", () => {
  it("BE Page를 1-base Page<ProductSummary>로 변환한다", () => {
    const dto: WishlistPageDto = {
      content: [
        {
          productId: 101,
          name: "백자 달항아리",
          price: 320000,
          thumbnail: [{ url: "https://cdn.example.com/a.webp" }],
          status: "SOLD_OUT",
          rating: 4.8,
          artisanId: 11,
          artisanName: "김도예",
          primaryBadge: "NEW",
        },
      ],
      totalElements: 21,
      totalPages: 2,
      size: 20,
      number: 0, // BE 0-base
      first: true,
      last: false,
      empty: false,
    };

    const page = mapWishlistPage(dto);

    expect(page.page).toBe(1); // 0-base → 1-base
    expect(page.pageSize).toBe(20);
    expect(page.totalCount).toBe(21);
    expect(page.totalPages).toBe(2);
    expect(page.items).toEqual([
      {
        id: 101,
        name: "백자 달항아리",
        price: 320000,
        thumbnail: null,
        thumbnailUrl: "https://cdn.example.com/a.webp",
        artisan: { id: 11, name: "김도예" },
        craftCategory: null,
        rating: 4.8,
        reviewCount: null,
        primaryBadge: "NEW",
        isSoldOut: true,
      },
    ]);
  });

  it("thumbnail 빈 배열이면 thumbnailUrl은 null", () => {
    const dto: WishlistPageDto = {
      content: [
        {
          productId: 102,
          name: "옻칠 3단 찬합",
          price: 189000,
          thumbnail: [],
          status: "ON_SALE",
          rating: null,
          artisanId: 12,
          artisanName: null,
          primaryBadge: null,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    const page = mapWishlistPage(dto);

    expect(page.items[0]?.thumbnailUrl).toBeNull();
    expect(page.items[0]?.isSoldOut).toBe(false);
  });

  it("totalPages가 0이어도 최소 1로 보정한다", () => {
    const dto: WishlistPageDto = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: true,
    };

    expect(mapWishlistPage(dto).totalPages).toBe(1);
  });
});
