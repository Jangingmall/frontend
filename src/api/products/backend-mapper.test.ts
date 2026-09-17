import { describe, expect, it } from "vitest";

import {
  mapBackendProductCategories,
  resolveProductCategoryCode,
} from "./backend-mapper";

describe("확정된 PD 분류 매핑", () => {
  it("표시 이름이 같아도 확정 매핑이 없으면 코드나 숫자 ID를 사용하지 않는다", () => {
    for (const response of [
      [{ code: "TEA", name: "다기·찻잔" }],
      [{ categoryId: 23, name: "다기 · 찻잔" }],
    ]) {
      const categories = mapBackendProductCategories(response);
      expect(
        categories.find((item) => item.id === "다기-찻잔")?.apiCode,
      ).toBeUndefined();
      expect(() => resolveProductCategoryCode("다기-찻잔", categories)).toThrow(
        expect.objectContaining({ code: "PRODUCT_CATEGORY_NOT_MAPPED" }),
      );
    }
  });
  it("명시한 GNB ID와 응답 코드가 일치할 때만 연결하며 표시 이름에 의존하지 않는다", () => {
    const categories = mapBackendProductCategories(
      [{ code: "TEA", name: "백엔드 표시 이름" }],
      { "다기-찻잔": "TEA" },
    );
    expect(resolveProductCategoryCode("다기-찻잔", categories)).toBe("TEA");
    expect(categories.find((item) => item.id === "다기-찻잔")?.name).toBe(
      "다기 · 찻잔",
    );
  });
  it("확정 매핑이 있어도 응답에서 사라진 코드는 조회에 사용하지 않는다", () => {
    const categories = mapBackendProductCategories([], { "다기-찻잔": "TEA" });
    expect(() => resolveProductCategoryCode("다기-찻잔", categories)).toThrow();
  });
});
