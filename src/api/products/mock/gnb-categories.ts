import { mapBackendProductCategories } from "@/api/products/backend-mapper";
import { toGnbCategories } from "@/lib/gnb-categories";

import { backendCategoryDtos, backendSubcategoryDtos } from "./category-seed";

/** 테스트·스토리용 분류 트리 — 백엔드 시드(대분류 7·소분류 56)와 같다. */
export const gnbCategoriesFixture = toGnbCategories(
  mapBackendProductCategories(backendCategoryDtos, backendSubcategoryDtos),
);
