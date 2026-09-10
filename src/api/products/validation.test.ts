import { describe, expect, it } from "vitest";

import { productListEmpty, productListPage1 } from "./mock/fixtures";
import { productListResponseDto } from "./validation";

const validItem = productListPage1.items[0];

describe("productListResponseDto", () => {
  it("mock fixture를 통과시킨다", () => {
    expect(productListResponseDto.parse(productListPage1)).toEqual(
      productListPage1,
    );
    expect(productListResponseDto.parse(productListEmpty)).toEqual(
      productListEmpty,
    );
  });

  it("rating은 null과 0을 모두 허용한다 (후기 0건은 null)", () => {
    expect(
      productListResponseDto.parse({
        items: [
          { ...validItem, rating: null },
          { ...validItem, id: 2, rating: 0 },
        ],
        totalCount: 2,
      }).items,
    ).toHaveLength(2);
  });

  it("BE가 필드를 추가해도 passthrough로 흡수한다", () => {
    const parsed = productListResponseDto.parse({
      items: [{ ...validItem, extraFromBe: "keep-me" }],
      totalCount: 1,
      pageInfo: { page: 1, size: 20, totalPages: 1 },
    });
    expect(parsed).toMatchObject({ pageInfo: { totalPages: 1 } });
    expect(parsed.items[0]).toMatchObject({ extraFromBe: "keep-me" });
  });

  it("공개 목록에 없어야 할 상태값은 거부한다", () => {
    expect(
      productListResponseDto.safeParse({
        items: [{ ...validItem, status: "DRAFT" }],
        totalCount: 1,
      }).success,
    ).toBe(false);
  });

  it("필수 필드가 빠지면 거부한다", () => {
    const withoutPrice: Record<string, unknown> = { ...validItem };
    delete withoutPrice.price;
    expect(
      productListResponseDto.safeParse({
        items: [withoutPrice],
        totalCount: 1,
      }).success,
    ).toBe(false);
  });
});
