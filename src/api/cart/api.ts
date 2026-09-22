import { ApiError } from "@/lib/http/api-error";
import { clientFetch } from "@/lib/http/client";
import type { CartItemInput } from "@/types/cart";

import { mapCart } from "./mapper";
import { cartDto } from "./validation";
const path = "/api/payments/cart";
async function cartRequest(suffix: string, method = "GET", body?: unknown) {
  return mapCart(
    cartDto.parse(
      await clientFetch<unknown>(path + suffix, {
        method,
        body,
        credentials: "same-origin",
      }),
    ),
  );
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
