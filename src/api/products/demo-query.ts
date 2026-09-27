import { ApiError } from "@/lib/http/api-error";
import type { ProductCategory } from "@/types/product-filter";

import type { ProductListQuery } from "./query";
// IDs are not portable across deployments. Match the names of the documented kitchen taxonomy.
const names = [
  "키친다이닝",
  "다기찻잔",
  "그릇접시",
  "수저젓가락",
  "컵술병술잔",
  "소반쟁반",
  "칼도마",
  "항아리옹기",
  "냄비솥",
  "제기",
];
const normalize = (value: string) => value.replace(/[\s·・,]/g, "");
const materials: Record<string, string> = {
  도자기: "ceramic",
  도자: "ceramic",
  목재: "wood",
  나무: "wood",
  유기: "brass",
  놋쇠: "brass",
  유리: "glass",
  대나무: "bamboo",
  금속: "metal",
};
export function toDemoProductQuery(
  query: ProductListQuery,
  categories: ProductCategory[],
): ProductListQuery {
  let category = query.category;
  if (category && /^(sub)?category-/.test(category)) {
    const name = categories.find((item) => item.id === category)?.name;
    const index = names.indexOf(normalize(name ?? ""));
    if (index < 0)
      throw new ApiError(422, { errorCode: "DEMO_CATEGORY_NOT_AVAILABLE" });
    category = index === 0 ? "kitchen" : `kitchen-${index}`;
  }
  return {
    ...query,
    category,
    materials: query.materials?.map((value) => {
      if (materials[value]) return materials[value];
      if (Object.values(materials).includes(value)) return value;
      throw new ApiError(422, { errorCode: "DEMO_MATERIAL_NOT_AVAILABLE" });
    }),
  };
}
