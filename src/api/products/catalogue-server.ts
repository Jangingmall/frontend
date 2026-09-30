import "server-only";

import { readDemoCatalogue } from "@/mocks/catalogue-server";

import { fetchProductCategoriesServer, fetchProductList } from "./api";
import { fetchDemoProductList, usesDemoCatalogue } from "./demo-catalogue";
import type { ProductListQuery } from "./query";

export async function fetchProductCatalogue(query: ProductListQuery = {}) {
  if (!usesDemoCatalogue(query)) return fetchProductList(query);
  return fetchDemoProductList(
    query,
    query.category ? await fetchProductCategoriesServer() : [],
    readDemoCatalogue,
  );
}
