import type { ProductCategory } from "@/types/product-filter";

export const DESIGN_MATERIALS = Array.from({ length: 6 }, (_, index) => ({
  id: `design-material-${index + 1}`,
  name: `소재 ${index + 1}`,
}));

/**
 * URL의 `category` 값(`category-{n}` · `subcategory-{n}`)을 백엔드 분류 목록에서 찾는다. GNB 링크도
 * 같은 ID를 쓰므로 이름 추정 매핑이 필요 없다. 목록에 없는 값(오타, 다른 배포의 ID)은 미매핑으로
 * 다뤄 API에 전달하지 않는다.
 */
export function resolveCategoryView(
  id: string | undefined,
  categories: ProductCategory[],
) {
  const category = categories.find((item) => item.id === id);
  return {
    category,
    categories,
    apiCategory: category?.id,
    isMapped: id === undefined || category !== undefined,
  };
}
