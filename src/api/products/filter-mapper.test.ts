import { expect, it } from "vitest";

import { productCraftsDto } from "./filter-validation";
import {
  mapProductCategories,
  mapProductCrafts,
  mapProductMaterials,
} from "./mapper";
import { productCategories } from "./mock/catalogue";

it("소재의 화면 필드만 반환하고 DTO와 참조를 분리한다", () => {
  const dto = [{ id: "wood", name: "목재", internalCode: "private" }];
  const mapped = mapProductMaterials(dto);
  expect(mapped).toEqual([{ id: "wood", name: "목재" }]);
  expect(mapped[0]).not.toBe(dto[0]);
});

it("카테고리의 화면 필드만 복사해 DTO와 참조를 분리한다", () => {
  const dto = [{ ...productCategories[0], internalCode: "private" }];
  const mapped = mapProductCategories(dto);
  expect(mapped).toEqual([productCategories[0]]);
  expect(mapped[0]).not.toBe(dto[0]);
});

it("종목은 숫자 ID의 실제 응답을 검증하고 쓰임 분류 ID와 분리한다", () => {
  const dto = [
    {
      subcategoryId: 12,
      categoryId: 3,
      name: "사기장",
      internalCode: "private",
    },
  ];
  expect(mapProductCrafts(productCraftsDto.parse(dto))).toEqual([
    { id: "12", name: "사기장" },
  ]);
  expect(
    productCraftsDto.safeParse([{ id: "kitchen-1", name: "다기 · 찻잔" }])
      .success,
  ).toBe(false);
  expect(
    productCraftsDto.safeParse([{ ...dto[0], subcategoryId: -1 }]).success,
  ).toBe(false);
});
