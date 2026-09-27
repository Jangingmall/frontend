import { expect, it } from "vitest";

import { toDemoProductQuery } from "./demo-query";
it("deployment-specific category IDs map by names and material labels", () => {
  expect(
    toDemoProductQuery(
      { category: "subcategory-72", materials: ["도자기", "나무"] },
      [
        {
          id: "subcategory-72",
          name: "다기·찻잔",
          parentId: "category-9",
          description: "",
          minPrice: 0,
          maxPrice: 1000000,
        },
      ],
    ),
  ).toMatchObject({ category: "kitchen-1", materials: ["ceramic", "wood"] });
});
it("unmapped categories never silently return unrelated or empty mock products", () => {
  expect(() =>
    toDemoProductQuery({ category: "subcategory-999" }, []),
  ).toThrow();
});
