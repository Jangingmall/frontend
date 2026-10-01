import { fetchProductThumbnail } from "@/api/products/thumbnail-client";
import { ApiError } from "@/lib/http/api-error";
import { clientFetch } from "@/lib/http/client";
import type { CartItemInput } from "@/types/cart";

import { mapCart } from "./mapper";
import { cartDto } from "./validation";
const path = "/api/payments/cart";
async function cartRequest(suffix: string, method = "GET", body?: unknown) {
  const cart = mapCart(
    cartDto.parse(
      await clientFetch<unknown>(path + suffix, {
        method,
        body,
        credentials: "same-origin",
      }),
    ),
  );
  // 구형 상품은 장바구니 thumbnail이 비어 있어 공개 상품 대표 이미지로 보완한다.
  const missingIds = [
    ...new Set(
      cart.lines
        .filter((line) => !line.thumbnailUrl)
        .map((line) => line.productId),
    ),
  ];
  const thumbnails = new Map(
    await Promise.all(
      missingIds.map(async (productId) => {
        try {
          return [productId, await fetchProductThumbnail(productId)] as const;
        } catch {
          // 보조 이미지 조회 실패가 성공한 장바구니 조회·변경을 실패로 바꾸지 않는다.
          return [productId, null] as const;
        }
      }),
    ),
  );
  return {
    ...cart,
    lines: cart.lines.map((line) => ({
      ...line,
      thumbnailUrl: line.thumbnailUrl || thumbnails.get(line.productId) || null,
    })),
  };
}
export const fetchCart = () => cartRequest("");
export const addCartItem = (body: CartItemInput) =>
  cartRequest("/items", "POST", body);
export const updateCartQuantity = ({
  cartItemId,
  quantity,
}: {
  cartItemId: number;
  quantity: number;
}) => cartRequest(`/items/${cartItemId}`, "PATCH", { quantity });
export const deleteCartItem = (cartItemId: number) =>
  clientFetch<null>(`${path}/items/${cartItemId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
export async function mergeGuestCart() {
  try {
    return await cartRequest("/merge", "POST");
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 400 &&
      error.code === "INVALID_INPUT"
    )
      return null;
    throw error;
  }
}
export const updateCartOptions = ({
  cartItemId,
  ...body
}: { cartItemId: number } & Pick<
  CartItemInput,
  "selectedOptions" | "textInputs"
> & { quantity?: number }) =>
  cartRequest(`/items/${cartItemId}/options`, "PATCH", body);
