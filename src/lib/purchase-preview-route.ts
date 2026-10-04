import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

/** 인증·실제 장바구니 동기화가 필요 없는 시연 주문서와 결제 복귀 화면만 허용한다. */
export function isPurchasePreviewRoute(pathname: string) {
  const checkoutPath = `/checkout/${PURCHASE_PREVIEW_ORDER_ID}`;
  return pathname === checkoutPath || pathname === `${checkoutPath}/complete`;
}
