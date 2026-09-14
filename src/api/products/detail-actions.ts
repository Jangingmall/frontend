import { publicEnv } from "@/lib/env";
import { clientFetch } from "@/lib/http/client";

import {
  productActionResultDto,
  productActionStateDto,
  productCartInput,
  type ProductCartLine,
} from "./detail-actions-validation";

/** 잠정 UI 시연 계약. 실제 BE 계약이 확정되기 전에는 네트워크 호출하지 않는다. */
function actionPath(productId: number, action = "") {
  if (!publicEnv.apiMocking) throw new Error("이 기능은 아직 준비 중입니다.");
  return `/api/products/${productId}/detail-actions${action}`;
}

export async function fetchProductActionState(productId: number) {
  return productActionStateDto.parse(await clientFetch(actionPath(productId)));
}

export async function setProductWishlist(productId: number, wished: boolean) {
  return productActionStateDto.parse(
    await clientFetch(actionPath(productId, "/wishlist"), {
      method: "PUT",
      body: { wished },
    }),
  );
}

export async function addProductToCart(
  productId: number,
  lines: ProductCartLine[],
) {
  const path = actionPath(productId, "/cart-items");
  return productActionResultDto.parse(
    await clientFetch(path, {
      method: "POST",
      body: productCartInput.parse({ lines }),
    }),
  );
}

export async function requestProductRestock(productId: number) {
  return productActionResultDto.parse(
    await clientFetch(actionPath(productId, "/restock"), { method: "POST" }),
  );
}
