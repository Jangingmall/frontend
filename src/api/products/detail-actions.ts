import { addWish, checkWished, removeWish } from "@/api/wishlist/api";
import { publicEnv } from "@/lib/env";
import { clientFetch } from "@/lib/http/client";

import {
  backendCartDto,
  backendCartInput,
  productActionResultDto,
  productCartInput,
  type ProductCartLine,
  restockDemoStateDto,
} from "./detail-actions-validation";

/** 상세 확장 시연 API는 MSW에서만 호출한다. */
function actionPath(productId: number, action = "") {
  return `/api/products/${productId}/detail-actions${action}`;
}

/** 실제 상품의 찜은 백엔드에서 조회하고 재입고 상태는 mock 모드에서만 조회한다. */
export async function fetchProductActionState(
  productId: number,
  preview = false,
) {
  if (preview && !publicEnv.apiMocking)
    throw new Error("시연 상품은 사용할 수 없습니다.");
  const wished = await checkWished(productId);
  if (!publicEnv.apiMocking) return { wished, restockRequested: false };
  const restockRequested = restockDemoStateDto.parse(
    await clientFetch(actionPath(productId)),
  ).restockRequested;
  return { wished, restockRequested };
}

export async function setProductWishlist(
  productId: number,
  wished: boolean,
  preview = false,
) {
  if (preview && !publicEnv.apiMocking)
    throw new Error("시연 상품은 사용할 수 없습니다.");
  await (wished ? addWish(productId) : removeWish(productId));
  return { wished, restockRequested: false };
}

export async function addProductToCart(
  productId: number,
  lines: ProductCartLine[],
  preview = publicEnv.apiMocking,
) {
  if (preview && !publicEnv.apiMocking)
    throw new Error("시연 상품은 사용할 수 없습니다.");
  if (!preview) {
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
  if (!publicEnv.apiMocking)
    throw new Error("재입고 알림은 아직 지원하지 않습니다.");
  return productActionResultDto.parse(
    await clientFetch(actionPath(productId, "/restock"), { method: "POST" }),
  );
}
