import {
  type ProductListQuery,
  toProductListSearchParams,
} from "@/api/products/query";
import { publicEnv } from "@/lib/env";

export const productKeys = {
  all: ["products"] as const,
  actionState: (userId: number | null, productId: number) =>
    ["product-detail-actions", userId, productId] as const,
  list: (query: ProductListQuery) =>
    [
      "products",
      "list",
      publicEnv.apiMocking
        ? toProductListSearchParams(query).toString()
        : JSON.stringify([
            toProductListSearchParams(query).toString(),
            query.category ?? null,
            query.keyword ?? null,
            query.minPrice ?? null,
            query.maxPrice ?? null,
            query.giftTheme ?? null,
          ]),
    ] as const,
  categories: ["products", "categories"] as const,
  crafts: (category?: string) =>
    ["products", "crafts", category ?? null] as const,
  materials: (category?: string) =>
    ["products", "materials", category ?? null] as const,
};
