import { describe, expect, it } from "vitest";

import { mapRecentViewPage } from "./mapper";
import type { RecentViewPageDto } from "./validation";

describe("mapRecentViewPage", () => {
  it("BE Page를 1-base Page<ProductSummary>로 변환하고 viewedAt은 버린다", () => {
    const dto: RecentViewPageDto = {
      content: [
        {
          productId: 109,
          name: "놋그릇 5첩 반상기",
          price: 520000,
          thumbnail: [{ url: "https://cdn.example.com/b.webp" }],
          status: "ON_SALE",
          rating: 4.6,
          artisanId: 19,
          artisanName: "강유기",
          primaryBadge: null,
          viewedAt: "2026-09-21T00:00:00.000Z",
        },
      ],
      totalElements: 6,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    };

    const page = mapRecentViewPage(dto);

    expect(page.page).toBe(1);
    expect(page.items).toEqual([
      {
        id: 109,
        name: "놋그릇 5첩 반상기",
        price: 520000,
        thumbnail: null,
        thumbnailUrl: "https://cdn.example.com/b.webp",
        artisan: { id: 19, name: "강유기" },
        craftCategory: null,
        rating: 4.6,
        reviewCount: null,
        primaryBadge: null,
        isSoldOut: false,
      },
    ]);
    expect(page.items[0]).not.toHaveProperty("viewedAt");
  });
});
