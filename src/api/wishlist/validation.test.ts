import { describe, expect, it } from "vitest";

import { wishlistPageDto } from "./validation";

const springPage = {
  totalElements: 1,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

describe("wishlistPageDto", () => {
  it("실제 BE product() 프로젝션 shape을 검증한다", () => {
    const parsed = wishlistPageDto.parse({
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
          primaryBadge: "NEW",
          // 실제 BE가 더 주는 필드 — passthrough로 흡수되고 검증은 안 함
          category: "kitchen-1",
          isLimited: false,
        },
      ],
      ...springPage,
    });
    expect(parsed.content).toHaveLength(1);
    expect(parsed.content[0]).toMatchObject({
      productId: 101,
      name: "백자 달항아리",
    });
  });

  it("rating·artisanName·primaryBadge는 null을 허용한다", () => {
    const parsed = wishlistPageDto.parse({
      content: [
        {
          productId: 102,
          name: "옻칠 3단 찬합",
          price: 189000,
          thumbnail: [],
          status: "SOLD_OUT",
          rating: null,
          artisanId: 12,
          artisanName: null,
          primaryBadge: null,
        },
      ],
      ...springPage,
    });
    expect(parsed.content[0]).toMatchObject({
      rating: null,
      artisanName: null,
      primaryBadge: null,
    });
  });

  it("필수 필드가 없으면 실패한다", () => {
    expect(() =>
      wishlistPageDto.parse({
        content: [{ name: "이름만 있음" }],
        ...springPage,
      }),
    ).toThrow();
  });
});
