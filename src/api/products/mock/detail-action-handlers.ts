import { type DefaultBodyType, http, type PathParams } from "msw";

import {
  SEED_ACCESS_TOKEN,
  SEED_ACCESS_TOKEN_PREFIX,
  SEED_ACCESS_TOKEN_REFRESHED,
} from "@/api/member/mock/fixtures";
import {
  productCartInput,
  type ProductCartLine,
  productWishlistInput,
} from "@/api/products/detail-actions-validation";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { ProductDetail } from "@/types/product-detail";

import { getProductDetailMock } from "./detail-fixtures";

type Envelope = ApiResponse<unknown> | ApiErrorResponse;
const states = new Map<
  string,
  { wished: boolean; restockRequested: boolean; cart: Set<string> }
>();

export function resetProductDetailActionState() {
  states.clear();
}

function getState(request: Request, id: string) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token?.startsWith(SEED_ACCESS_TOKEN_PREFIX)) return null;
  const user =
    token === SEED_ACCESS_TOKEN_REFRESHED ? SEED_ACCESS_TOKEN : token;
  const key = `${user}:${id}`;
  const state = states.get(key) ?? {
    wished: false,
    restockRequested: false,
    cart: new Set<string>(),
  };
  states.set(key, state);
  return state;
}

function canAddLines(product: ProductDetail, lines: ProductCartLine[]) {
  if (
    product.status !== "ON_SALE" ||
    product.stock === null ||
    lines.reduce((sum, line) => sum + line.quantity, 0) > product.stock
  )
    return false;
  const consumed = new Map<string, number>();
  for (const line of lines) {
    const ids: string[] = [];
    if (
      Object.keys(line.choices).some(
        (id) => !product.optionGroups.some((group) => group.id === id),
      )
    )
      return false;
    for (const group of product.optionGroups) {
      const value = group.values.find(
        (value) => value.id === line.choices[group.id],
      );
      if ((!value && group.required) || (line.choices[group.id] && !value))
        return false;
      if (!value) continue;
      const key = `${group.id}:${value.id}`;
      const count = (consumed.get(key) ?? 0) + line.quantity;
      consumed.set(key, count);
      if (value.stock === null || count > value.stock) return false;
      if (group.kind === "STANDARD") ids.push(value.id);
    }
    if (product.variants !== null) {
      const variant = product.variants.find(
        (variant) =>
          variant.valueIds.length === ids.length &&
          variant.valueIds.every((id) => ids.includes(id)),
      );
      if (!variant) return false;
      const count =
        (consumed.get(`variant:${variant.id}`) ?? 0) + line.quantity;
      consumed.set(`variant:${variant.id}`, count);
      if (count > variant.stock) return false;
    }
  }
  return true;
}

const path = "*/api/products/:productId/detail-actions";

/** MSW runtime에만 보관하는 잠정 계약. 사용자·상품별 찜/알림/장바구니 중복 상태. */
export const productDetailActionHandlers = [
  http.get<PathParams, DefaultBodyType, Envelope>(
    path,
    ({ request, params }) => {
      const state = getState(request, String(params.productId));
      if (!state) return mockError(401, "UNAUTHORIZED");
      if (!getProductDetailMock(Number(params.productId)))
        return mockError(404, "NOT_FOUND");
      return mockOk({
        wished: state.wished,
        restockRequested: state.restockRequested,
      });
    },
  ),
  http.put<PathParams, DefaultBodyType, Envelope>(
    `${path}/wishlist`,
    async ({ request, params }) => {
      const state = getState(request, String(params.productId));
      if (!state) return mockError(401, "UNAUTHORIZED");
      if (!getProductDetailMock(Number(params.productId)))
        return mockError(404, "NOT_FOUND");
      const input = productWishlistInput.safeParse(
        await request.json().catch(() => null),
      );
      if (!input.success) return mockError(400, "INVALID_INPUT");
      state.wished = input.data.wished;
      return mockOk({
        wished: state.wished,
        restockRequested: state.restockRequested,
      });
    },
  ),
  http.post<PathParams, DefaultBodyType, Envelope>(
    `${path}/restock`,
    ({ request, params }) => {
      const state = getState(request, String(params.productId));
      if (!state) return mockError(401, "UNAUTHORIZED");
      const product = getProductDetailMock(Number(params.productId));
      if (!product) return mockError(404, "NOT_FOUND");
      if (product.status !== "SOLD_OUT") return mockError(409, "CONFLICT");
      const duplicate = state.restockRequested;
      state.restockRequested = true;
      return mockOk({ duplicate });
    },
  ),
  http.post<PathParams, DefaultBodyType, Envelope>(
    `${path}/cart-items`,
    async ({ request, params }) => {
      const state = getState(request, String(params.productId));
      if (!state) return mockError(401, "UNAUTHORIZED");
      const product = getProductDetailMock(Number(params.productId));
      if (!product) return mockError(404, "NOT_FOUND");
      const input = productCartInput.safeParse(
        await request.json().catch(() => null),
      );
      if (!input.success) return mockError(400, "INVALID_INPUT");
      if (!canAddLines(product, input.data.lines))
        return mockError(409, "CONFLICT");
      const keys = input.data.lines.map((line) =>
        JSON.stringify(
          Object.entries(line.choices).sort(([a], [b]) => a.localeCompare(b)),
        ),
      );
      const duplicate = keys.some((key) => state.cart.has(key));
      for (const key of keys) state.cart.add(key);
      return mockOk({ duplicate });
    },
  ),
];
