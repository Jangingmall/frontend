import { publicEnv } from "@/lib/env";
import { clientFetch } from "@/lib/http/client";

import * as actual from "./detail-actions";
import {
  productActionResultDto,
  productActionStateDto,
  productCartInput,
  type ProductCartLine,
} from "./detail-actions-validation";
export async function fetchProductActionState(id: number, preview = false) {
  if (!preview || publicEnv.apiMocking)
    return actual.fetchProductActionState(id, preview);
  return productActionStateDto.parse(
    await clientFetch(`/api/mock/products/${id}/actions`),
  );
}
export async function setProductWishlist(
  id: number,
  wished: boolean,
  preview = false,
) {
  if (!preview || publicEnv.apiMocking)
    return actual.setProductWishlist(id, wished, preview);
  return productActionStateDto.parse(
    await clientFetch(`/api/mock/products/${id}/actions`, {
      method: "PATCH",
      body: { wished },
    }),
  );
}
export async function addProductToCart(
  id: number,
  lines: ProductCartLine[],
  preview = publicEnv.apiMocking,
) {
  if (!preview || publicEnv.apiMocking)
    return actual.addProductToCart(id, lines, preview);
  return productActionResultDto.parse(
    await clientFetch(`/api/mock/products/${id}/cart-selections`, {
      method: "POST",
      body: productCartInput.parse({ lines }),
    }),
  );
}
export async function requestProductRestock(id: number) {
  if (publicEnv.apiMocking) return actual.requestProductRestock(id);
  return productActionResultDto.parse(
    await clientFetch(`/api/mock/products/${id}/restock`, { method: "POST" }),
  );
}
