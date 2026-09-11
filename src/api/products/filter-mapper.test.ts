import { expect, it } from "vitest";

import { mapProductCategories } from "./mapper";
import { productCategories } from "./mock/catalogue";

it("카테고리의 화면 필드만 복사해 DTO와 참조를 분리한다", () => {
  const dto = [{ ...productCategories[0], internalCode: "private" }];
  const mapped = mapProductCategories(dto);
  expect(mapped).toEqual([productCategories[0]]);
  expect(mapped[0]).not.toBe(dto[0]);
});
