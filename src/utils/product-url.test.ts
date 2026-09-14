import { describe, expect, it } from "vitest";

import {
  getProductPath,
  isCanonicalProductSlug,
  parseProductId,
} from "./product-url";

describe("상품 상세 URL", () => {
  it("한글·공백·하이픈을 유지하고 카드와 상세가 같은 주소를 사용한다", () => {
    expect(getProductPath({ id: 101, name: "  백자 - 달항아리  " })).toBe(
      "/products/%EB%B0%B1%EC%9E%90---%EB%8B%AC%ED%95%AD%EC%95%84%EB%A6%AC-101",
    );
    expect(parseProductId("백자---달항아리-101")).toBe(101);
    expect(parseProductId("3단-찬합-102")).toBe(102);
  });

  it.each([
    "",
    "백자",
    "101",
    "백자-0",
    "--1",
    "백자-1.2",
    "백자-1e3",
    "-1",
    "백자-9007199254740992",
    "백자-12/extra",
  ])("잘못된 세그먼트 %s 는 상품 ID가 아니다", (slug) =>
    expect(parseProductId(slug)).toBeNull(),
  );

  it("상품명이 비어도 안정적인 상세 경로를 만든다", () => {
    expect(getProductPath({ id: 42, name: " " })).toBe("/products/product-42");
  });

  it("Next가 인코딩된 params를 전달해도 동일한 주소로 리다이렉트하지 않는다", () => {
    const product = { id: 101, name: "백자 달항아리" };
    expect(
      isCanonicalProductSlug(
        product,
        "%EB%B0%B1%EC%9E%90-%EB%8B%AC%ED%95%AD%EC%95%84%EB%A6%AC-101",
      ),
    ).toBe(true);
    expect(isCanonicalProductSlug(product, "백자-달항아리-101")).toBe(true);
    expect(isCanonicalProductSlug(product, "이전-제목-101")).toBe(false);
  });
});
