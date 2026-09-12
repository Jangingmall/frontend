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
});
