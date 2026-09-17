import {
  type ProductListQuery,
  toProductListSearchParams,
} from "@/api/products/query";

export const productKeys = {
  all: ["products"] as const,
  actionState: (userId: number | null, productId: number) =>
    ["product-detail-actions", userId, productId] as const,
  list: (query: ProductListQuery) =>
    ["products", "list", toProductListSearchParams(query).toString()] as const,
  categories: ["products", "categories"] as const,
  crafts: (category?: string) =>
    ["products", "crafts", category ?? null] as const,
  materials: (category?: string) =>
    ["products", "materials", category ?? null] as const,
};
