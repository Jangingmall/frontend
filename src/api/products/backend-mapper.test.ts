import { describe, expect, it } from "vitest";

import {
  mapBackendProductCategories,
  resolveProductCategoryCode,
} from "./backend-mapper";
describe("실제 분류 ID", () => {
  it("이름이 GNB와 같아도 명시적 실제 ID로만 선택한다", () => {
    const categories = mapBackendProductCategories([
      { categoryId: 23, name: "다기 · 찻잔" },
    ]);
    expect(resolveProductCategoryCode("category-23", categories)).toBe("23");
    expect(() => resolveProductCategoryCode("다기-찻잔", categories)).toThrow();
  });
  it("중복 ID와 존재하지 않는 부모를 거부한다", () => {
    expect(() =>
      mapBackendProductCategories([
        { categoryId: 1, name: "A" },
        { categoryId: 1, name: "B" },
      ]),
    ).toThrow();
    expect(() =>
      mapBackendProductCategories(
        [],
        [{ subcategoryId: 2, categoryId: 1, name: "컵" }],
      ),
    ).toThrow();
  });
});
