import type { ProductCategory } from "@/types/product-filter";

/**
 * GNB(메가패널·모바일 메뉴)가 그리는 분류 트리. 백엔드 분류(`ProductCategory[]`)를 화면용으로
 * 바꾼 것이라 `id`는 `/products?category=` 값(`category-{n}` · `subcategory-{n}`)과 같다.
 */
export interface GnbSubcategory {
  id: string;
  name: string;
}

export interface GnbCategory {
  id: string;
  name: string;
  subcategories: GnbSubcategory[];
}

/**
 * 표시 이름을 시안 표기로 정규화한다 — 백엔드는 가운뎃점 앞뒤에 공백이 없다("다기·찻잔").
 * 링크는 ID 기반이라 이 변환이 URL에 영향을 주지 않는다.
 */
export function formatCategoryName(name: string): string {
  return name
    .trim()
    .replace(/\s*[·・]\s*/g, " · ")
    .replace(/\s{2,}/g, " ");
}

/**
 * 평평한 분류 목록을 대분류 → 소분류 트리로 묶는다. 순서는 입력 순서 그대로다 — 백엔드가
 * 정렬 필드를 주지 않으며, 현재 시드에서는 ID 오름차순이 시안 순서와 같다.
 */
export function toGnbCategories(categories: ProductCategory[]): GnbCategory[] {
  return categories
    .filter((category) => category.parentId === null)
    .map((parent) => ({
      id: parent.id,
      name: formatCategoryName(parent.name),
      subcategories: categories
        .filter((category) => category.parentId === parent.id)
        .map((child) => ({
          id: child.id,
          name: formatCategoryName(child.name),
        })),
    }));
}
