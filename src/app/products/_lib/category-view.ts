import { GNB_CATEGORIES, toGnbCategoryCode } from "@/constants/gnb-category";
import type { ProductCategory } from "@/types/product-filter";

// 화면 분류는 헤더와 공유한다. API 분류가 준비되지 않아도 필터 구조는 유지한다.
export const PRODUCT_NAV_CATEGORIES: ProductCategory[] = GNB_CATEGORIES.flatMap(
  (category) => {
    const id = toGnbCategoryCode(category.name);
    const defaults = { description: "", minPrice: 1000, maxPrice: 800000 };
    return [
      { ...defaults, id, name: category.name, parentId: null },
      ...category.subcategories.map((child) => ({
        ...defaults,
        id: toGnbCategoryCode(child.name),
        name: child.name,
        parentId: id,
      })),
    ];
  },
);

export const DESIGN_MATERIALS = Array.from({ length: 6 }, (_, index) => ({
  id: `design-material-${index + 1}`,
  name: `소재 ${index + 1}`,
}));

export function resolveCategoryView(
  id: string | undefined,
  categories: ProductCategory[],
) {
  const display = PRODUCT_NAV_CATEGORIES.find((category) => category.id === id);
  if (!display) {
    const category = categories.find((category) => category.id === id);
    return {
      category,
      categories,
      apiCategory: category?.id,
      isMapped: id === undefined || category !== undefined,
    };
  }
  const normalize = (name: string) =>
    toGnbCategoryCode(name).replace(/\s/g, "");
  const parent = PRODUCT_NAV_CATEGORIES.find(
    (category) => category.id === display.parentId,
  );
  const matches = categories.filter((category) => {
    if (normalize(category.name) !== normalize(display.name)) return false;
    if (!parent) return category.parentId === null;
    return categories.some(
      (candidate) =>
        candidate.id === category.parentId &&
        normalize(candidate.name) === normalize(parent.name),
    );
  });
  return {
    category: display,
    categories: PRODUCT_NAV_CATEGORIES,
    apiCategory: matches.length === 1 ? matches[0].id : undefined,
    isMapped: matches.length === 1,
  };
}
