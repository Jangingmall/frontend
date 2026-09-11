import { http } from "msw";

import { mockOk } from "@/mocks/envelope";

import {
  productCatalogue,
  productCategories,
  productMaterials,
} from "./catalogue";

/**
 * 상품 도메인 MSW 핸들러. `src/mocks/handlers.ts`에 등록된다.
 * 목록·필터 선택지의 잠정 계약을 재현한다. 상세·찜은 별도 작업이다.
 */
export const productHandlers = [
  http.get("*/api/products/categories", () => mockOk(productCategories)),
  http.get("*/api/products/materials", () => mockOk(productMaterials)),
  http.get("*/api/products", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const params = url.searchParams;
    const size = Math.min(100, Math.max(1, Number(params.get("size")) || 20));
    const category = params.get("category");
    const materials = params.getAll("material");
    const items = productCatalogue.filter(
      (product) =>
        (!category ||
          category === "kitchen" ||
          product.category === category) &&
        (!materials.length || materials.includes(product.material)) &&
        (!params.has("minPrice") ||
          product.price >= Number(params.get("minPrice"))) &&
        (!params.has("maxPrice") ||
          product.price <= Number(params.get("maxPrice"))) &&
        (params.get("hasGiftWrap") !== "true" || product.hasGiftWrap) &&
        (params.get("excludeSoldOut") !== "true" ||
          product.status !== "SOLD_OUT") &&
        (!params.get("keyword") ||
          product.name.includes(params.get("keyword")!)),
    );
    items.sort((a, b) => {
      switch (params.get("sort")) {
        case "PRICE_ASC":
          return a.price - b.price || a.id - b.id;
        case "PRICE_DESC":
          return b.price - a.price || a.id - b.id;
        case "NEWEST":
          return b.id - a.id;
        case "WISHLIST_COUNT":
          return b.wishlistCount - a.wishlistCount || a.id - b.id;
        case "SALES_COUNT":
          return b.salesCount - a.salesCount || a.id - b.id;
        default:
          return b.popularity - a.popularity;
      }
    });
    const offset = (Math.max(1, page || 1) - 1) * size;
    return mockOk({
      items: items.slice(offset, offset + size),
      totalCount: items.length,
    });
  }),
];
