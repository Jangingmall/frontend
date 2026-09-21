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
  if (!publicEnv.apiMocking) throw new Error("이 기능은 아직 준비 중입니다.");
  return `/api/products/${productId}/detail-actions${action}`;
}

/**
 * 찜 여부는 목업 상태와 무관하게 항상 실제 계약 경로(`api/wishlist`)로 확인한다 — 목업
 * 상태에 따라 다른 엔드포인트를 호출하지 않는다(원칙: API 호출은 목업 여부로 갈리지 않고,
 * 목업이냐 아니냐는 MSW가 그 경로를 가로채는지로만 갈린다). 재입고 알림(`restockRequested`)은
 * 대응하는 실제 BE 엔드포인트 자체가 없어(`requestProductRestock`과 동일 사유) 목업일 때만
 * 데모 전용 상태를 읽고, 아니면 항상 `false`다.
 */
export async function fetchProductActionState(productId: number) {
  const wished = await checkWished(productId);
  const restockRequested = publicEnv.apiMocking
    ? restockDemoStateDto.parse(await clientFetch(actionPath(productId)))
        .restockRequested
    : false;
  return { wished, restockRequested };
}

export async function setProductWishlist(productId: number, wished: boolean) {
  await (wished ? addWish(productId) : removeWish(productId));
  return { wished, restockRequested: false };
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
