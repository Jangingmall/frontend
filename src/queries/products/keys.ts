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
  crafts: ["products", "crafts"] as const,
  materials: ["products", "materials"] as const,
};
