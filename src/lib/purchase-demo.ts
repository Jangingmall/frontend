import type { CartPreviewLine } from "@/types/purchase-preview";

/** 실제 장바구니를 변경하지 않고, JSON으로 전송할 수 있는 시연용 복사본을 만든다. */
export function copyCartForDemo(lines: CartPreviewLine[]): CartPreviewLine[] {
  return lines.map((line) => ({
    ...line,
    // 실제 API가 재고 상한을 제공하지 않은 경우의 Infinity는 JSON에서 null이 된다.
    maxQuantity: Number.isFinite(line.maxQuantity)
      ? line.maxQuantity
      : Math.max(99, line.quantity),
    options: [...line.options],
    thumbnail: {
      ...line.thumbnail,
      variants: line.thumbnail.variants.map((variant) => ({ ...variant })),
    },
  }));
}
