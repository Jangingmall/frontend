import { describe, expect, it } from "vitest";

import { recentViewPageDto } from "./validation";

const springPage = {
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

describe("recentViewPageDto", () => {
  it("product() 프로젝션 + viewedAt을 검증한다", () => {
    const parsed = recentViewPageDto.parse({
      content: [
        {
          productId: 101,
          name: "백자 달항아리",
          price: 320000,
          thumbnail: [{ url: "https://cdn.example.com/a.webp" }],
          status: "ON_SALE",
          rating: 4.8,
          artisanId: 11,
          artisanName: "김도예",
          primaryBadge: null,
          viewedAt: "2026-09-21T00:00:00.000Z",
        },
      ],
      ...springPage,
    });
    expect(parsed.content[0]).toMatchObject({
      productId: 101,
      viewedAt: "2026-09-21T00:00:00.000Z",
    });
  });

  it("viewedAt이 없으면 실패한다", () => {
    expect(() =>
      recentViewPageDto.parse({
        content: [
          {
            productId: 101,
            name: "백자 달항아리",
            price: 320000,
            thumbnail: [],
            status: "ON_SALE",
            rating: null,
            artisanId: 11,
            artisanName: null,
            primaryBadge: null,
          },
        ],
        ...springPage,
      }),
    ).toThrow();
  });
});
