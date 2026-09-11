import {
  type ProductListQuery,
  toProductListSearchParams,
} from "@/api/products/query";

export const productKeys = {
  all: ["products"] as const,
  list: (query: ProductListQuery) =>
    ["products", "list", toProductListSearchParams(query).toString()] as const,
  categories: ["products", "categories"] as const,
  materials: ["products", "materials"] as const,
};
