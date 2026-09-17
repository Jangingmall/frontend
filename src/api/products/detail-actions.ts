import { publicEnv } from "@/lib/env";
import { clientFetch } from "@/lib/http/client";

import {
  backendCartDto,
  backendCartInput,
  productActionResultDto,
  productActionStateDto,
  productCartInput,
  type ProductCartLine,
  productWishPageDto,
} from "./detail-actions-validation";

/** 상세 확장 시연 API는 MSW에서만 호출한다. */
function actionPath(productId: number, action = "") {
  if (!publicEnv.apiMocking) throw new Error("이 기능은 아직 준비 중입니다.");
  return `/api/products/${productId}/detail-actions${action}`;
}

export async function fetchProductActionState(productId: number) {
  if (!publicEnv.apiMocking) {
    const visited = new Set<string>();
    let cursor: string | null = null;
    for (let page = 0; page < 100; page++) {
      const params = new URLSearchParams({ limit: "100" });
      if (cursor) params.set("cursor", cursor);
      const result = productWishPageDto.parse(
        await clientFetch(`/api/member/me/wishes?${params}`, {
          cache: "no-store",
        }),
      );
      if (result.items.some((item) => item.productId === productId))
        return { wished: true, restockRequested: false };
      if (!result.hasNext) return { wished: false, restockRequested: false };
      if (!result.nextCursor || visited.has(result.nextCursor))
        throw new Error("찜 목록을 확인하지 못했습니다.");
      cursor = result.nextCursor;
      visited.add(cursor);
    }
    throw new Error("찜 목록을 모두 확인하지 못했습니다.");
  }
  return productActionStateDto.parse(await clientFetch(actionPath(productId)));
}

export async function setProductWishlist(productId: number, wished: boolean) {
  if (!publicEnv.apiMocking) {
    await clientFetch(`/api/products/${productId}/wish`, {
      method: wished ? "POST" : "DELETE",
    });
    return { wished, restockRequested: false };
  }
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
  if (!publicEnv.apiMocking) {
    const input = productCartInput.parse({ lines });
    // 현 API는 한 항목씩 추가한다. 여러 줄의 부분 성공/재시도 중복을 만들지 않는다.
    if (input.lines.length !== 1)
      throw new Error("한 번에 한 옵션 조합만 담을 수 있습니다.");
    const line = input.lines[0];
    const selectedOptions = Object.entries(line.choices).map(
      ([group, choice]) => {
        if (!/^[1-9]\d*$/.test(group) || !/^[1-9]\d*$/.test(choice))
          throw new Error("옵션 정보를 확인해 주세요.");
        return { optionGroupId: Number(group), choiceId: Number(choice) };
      },
    );
    const body = backendCartInput.parse({
      productId,
      quantity: line.quantity,
      selectedOptions,
      textInputs: [],
    });
    backendCartDto.parse(
      await clientFetch("/api/payments/cart/items", { method: "POST", body }),
    );
    // BE는 중복 여부 대신 갱신된 장바구니를 반환한다.
    return { duplicate: undefined };
  }
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
