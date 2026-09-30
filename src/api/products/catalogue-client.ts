import { clientFetch } from "@/lib/http/client";

import { fetchProductCategories, fetchProductListClient } from "./client";
import { fetchDemoProductList, usesDemoCatalogue } from "./demo-catalogue";
import { productCraftsDto } from "./filter-validation";
import { mapProductCrafts } from "./mapper";
import type { ProductListQuery } from "./query";

export async function fetchProductCatalogueClient(
  query: ProductListQuery,
  signal?: AbortSignal,
) {
  if (!usesDemoCatalogue(query)) return fetchProductListClient(query, signal);
  return fetchDemoProductList(
    query,
    query.category ? await fetchProductCategories(signal) : [],
    (path) => clientFetch(path, { auth: false, signal }),
  );
}

export async function fetchDemoProductCrafts(signal?: AbortSignal) {
  return mapProductCrafts(
    productCraftsDto.parse(
      await clientFetch("/api/mock/catalogue/products/crafts", {
        auth: false,
        signal,
      }),
    ),
  );
}
