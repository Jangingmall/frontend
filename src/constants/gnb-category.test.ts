import { describe, expect, it } from "vitest";

import { GNB_CATEGORIES, toGnbCategoryCode } from "./gnb-category";

describe("toGnbCategoryCode", () => {
  it("가운데점(·)을 하이픈으로 바꾼다", () => {
    expect(toGnbCategoryCode("키친 · 다이닝")).toBe("키친-다이닝");
    expect(toGnbCategoryCode("컵 · 술병 · 술잔")).toBe("컵-술병-술잔");
  });

  it("가운데점 아닌 이름은 그대로 둔다", () => {
    expect(toGnbCategoryCode("제기")).toBe("제기");
  });

  it("가운데점 앞뒤 공백이 들쭉날쭉해도(Figma 원문 방어) 정규화한다", () => {
    expect(toGnbCategoryCode("그릇  · 접시")).toBe("그릇-접시");
    expect(toGnbCategoryCode("수저  ·  젓가락")).toBe("수저-젓가락");
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(toGnbCategoryCode(" 부채 ")).toBe("부채");
  });
});

describe("GNB_CATEGORIES", () => {
  it("대분류가 7종이다", () => {
    expect(GNB_CATEGORIES).toHaveLength(7);
  });

  it("대분류 이름에 중복이 없다", () => {
    const names = GNB_CATEGORIES.map((category) => category.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("모든 대/소분류 코드값에 중복이 없다", () => {
    const codes = GNB_CATEGORIES.flatMap((category) => [
      toGnbCategoryCode(category.name),
      ...category.subcategories.map((sub) => toGnbCategoryCode(sub.name)),
    ]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("모든 대분류가 소분류를 하나 이상 가진다", () => {
    for (const category of GNB_CATEGORIES) {
      expect(category.subcategories.length).toBeGreaterThan(0);
    }
  });

  /**
   * Figma 원문(design.md §2.1 출처 표기) 기준 소분류 개수를 고정한다 — API가 아니라 정적
   * 상수가 유일한 데이터 원천이라, 항목이 실수로 빠지거나 중복돼도 다른 테스트는 못 잡는다
   * (리뷰 F2). 카테고리별 개수까지 고정해 어느 카테고리가 틀어졌는지 바로 알 수 있게 한다.
   */
  it("카테고리별 소분류 개수가 Figma 원문과 일치한다", () => {
    const counts = Object.fromEntries(
      GNB_CATEGORIES.map((category) => [
        category.name,
        category.subcategories.length,
      ]),
    );

    expect(counts).toEqual({
      "키친 · 다이닝": 9,
      "홈 · 인테리어": 7,
      "패션 · 액세서리": 12,
      "데스크 · 문구": 5,
      "패브릭 · 생활": 8,
      "아트 · 컬렉션": 9,
      "식품 · 전통주": 6,
    });
  });

  it("소분류 총 개수가 56개다", () => {
    const total = GNB_CATEGORIES.reduce(
      (sum, category) => sum + category.subcategories.length,
      0,
    );
    expect(total).toBe(56);
  });
});
