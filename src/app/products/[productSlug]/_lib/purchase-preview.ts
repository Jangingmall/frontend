import type { ProductDetail } from "@/types/product-detail";
import type { CartPreviewLine } from "@/types/purchase-preview";
import { getProductPath } from "@/utils/product-url";

import type { PurchaseSelection } from "./purchase-selection";

/** 상세에서 확인한 옵션·단가·수량을 카트와 결제가 공유하는 시연 항목으로 전달한다. */
export function toCartPreviewLines(
  product: ProductDetail,
  selections: PurchaseSelection[],
): CartPreviewLine[] {
  return selections.map((selection) => ({
    lineId: `${product.id}:${selection.key}`,
    productId: product.id,
    productPath: getProductPath(product),
    artisanId: product.artisan?.id ?? -product.id,
    artisanName: product.artisan?.name ?? "제작자 정보 준비 중",
    productName: product.name,
    thumbnail: {
      imageId: `product-${product.id}`,
      variants: product.images[0]
        ? [{ width: 320, url: product.images[0].src, format: "webp" }]
        : [],
    },
    options: product.optionGroups.map(
      (group) => `${group.label}: ${selection.optionLabels[group.id]}`,
    ),
    quantity: selection.quantity,
    unitPrice: selection.unitPrice,
    maxQuantity: selection.stock,
    soldOut: false,
    selected: true,
    note: product.shipping?.productionDays ?? undefined,
  }));
}
