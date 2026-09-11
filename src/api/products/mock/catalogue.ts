import type { ProductCategory, ProductMaterial } from "@/types/product-filter";

import { productListPage1 } from "./fixtures";

export const productCategories: ProductCategory[] = [
  {
    id: "kitchen",
    name: "키친 · 다이닝",
    description: "매일의 식탁에 깃드는 장인의 정성",
    parentId: null,
    minPrice: 0,
    maxPrice: 1000000,
  },
  ...[
    "다기 · 찻잔",
    "그릇 · 접시",
    "수저 · 젓가락",
    "컵 · 술병 · 술잔",
    "소반 · 쟁반",
    "칼 · 도마",
    "항아리 · 옹기",
    "냄비 · 솥",
    "제기",
  ].map((name, index) => ({
    id: `kitchen-${index + 1}`,
    name,
    description: "일상에 특별함을 더하는 수공예품",
    parentId: "kitchen",
    minPrice: 0,
    maxPrice: 1000000,
  })),
];

export const productMaterials: ProductMaterial[] = [
  { id: "ceramic", name: "도자기" },
  { id: "wood", name: "목재" },
  { id: "brass", name: "유기" },
  { id: "glass", name: "유리" },
  { id: "bamboo", name: "대나무" },
  { id: "metal", name: "금속" },
];

/** 번호 페이지, 필터 조합, 품절 상태를 재현하는 결정적 개발 데이터. */
export const productCatalogue = Array.from({ length: 140 }, (_, index) => {
  const seed = productListPage1.items[index % productListPage1.items.length];
  return {
    ...seed,
    id: 101 + index,
    name: `${seed.name}${index < 3 ? "" : ` ${Math.floor(index / 3) + 1}`}`,
    price: 20000 + (index % 40) * 15000,
    thumbnail: {
      ...seed.thumbnail,
      variants: seed.thumbnail.variants.map((variant) => ({
        ...variant,
        url: "/images/product-placeholder.png",
      })),
    },
    category: `kitchen-${(index % 9) + 1}`,
    material: productMaterials[index % productMaterials.length].id,
    hasGiftWrap: index % 2 === 0,
    popularity: 140 - index,
    colors: [
      { name: "백색", hex: "#FFFFFF" },
      { name: "회색", hex: "#CCCCCC" },
      { name: "연회색", hex: "#EEEEEE" },
      { name: "진회색", hex: "#999999" },
      { name: "흑색", hex: "#333333" },
    ],
    wishlistCount: index % 17,
    salesCount: index % 23,
  };
});
