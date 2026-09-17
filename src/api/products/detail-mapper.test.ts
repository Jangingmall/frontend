import { describe, expect, it } from "vitest";

import { mapProductDetail } from "./detail-mapper";
import { productDetailDto } from "./detail-validation";

const base = {
  productId: 101,
  artisanId: 11,
  title: "백자 달항아리",
  description: "손으로 빚은 백자",
  price: 20000,
  stock: 5,
  thumbnailUrl: "/images/product-placeholder.png",
  status: "ON_SALE",
};

describe("상품 상세 응답 경계", () => {
  it("현재 응답의 제작 기간을 사용하고 배송비는 추측하지 않는다", () => {
    expect(
      mapProductDetail(
        productDetailDto.parse({ ...base, productionPeriodDays: 7 }),
      )?.shipping,
    ).toEqual({ fee: null, freeAbove: null, productionDays: "7일" });
  });
  it.each([null, undefined, ""])(
    "상품 설명의 원래 값을 보존한다: %s",
    (description) => {
      expect(
        mapProductDetail(productDetailDto.parse({ ...base, description }))
          ?.description,
      ).toBe(description);
    },
  );

  it("현재 BE 응답에 없는 장인·옵션·후기를 만들어내지 않는다", () => {
    const result = mapProductDetail(productDetailDto.parse(base));
    expect(result).toMatchObject({
      id: 101,
      name: "백자 달항아리",
      price: 20000,
      stock: 5,
      artisan: null,
      optionGroups: [],
      rating: null,
      reviewCount: 0,
      relatedProducts: [],
      content: [],
      isMock: false,
    });
  });

  it.each(["DRAFT", "HIDDEN"])(
    "%s 는 공개 상세로 내보내지 않는다",
    (status) => {
      expect(
        mapProductDetail(productDetailDto.parse({ ...base, status })),
      ).toBeNull();
    },
  );

  it("품절은 공개 화면으로 유지한다", () => {
    expect(
      mapProductDetail(
        productDetailDto.parse({ ...base, status: "SOLD_OUT", stock: 0 }),
      ),
    ).toMatchObject({ status: "SOLD_OUT", stock: 0 });
  });

  it("이미지와 재고가 누락되면 빈 이미지와 알 수 없는 재고로 표시한다", () => {
    expect(
      mapProductDetail(
        productDetailDto.parse({ ...base, thumbnailUrl: null, stock: null }),
      ),
    ).toMatchObject({ images: [], stock: null });
  });

  it.each([
    { price: -1 },
    { price: 2.5 },
    { stock: -1 },
    { productId: 9007199254740992 },
  ])("손상된 금액·재고·ID를 거부한다: %j", (override) => {
    expect(productDetailDto.safeParse({ ...base, ...override }).success).toBe(
      false,
    );
  });

  it("이미지 URL의 실행 가능한 프로토콜을 거부한다", () => {
    expect(
      productDetailDto.safeParse({
        ...base,
        thumbnailUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
});
