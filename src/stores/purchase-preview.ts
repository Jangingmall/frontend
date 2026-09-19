import { create } from "zustand";

import type {
  CartPreviewLine,
  PurchasePreviewState,
} from "@/types/purchase-preview";
const copyLines = (lines: CartPreviewLine[]) =>
  lines.map((line) => ({
    ...line,
    options: [...line.options],
    thumbnail: {
      ...line.thumbnail,
      variants: line.thumbnail.variants.map((variant) => ({ ...variant })),
    },
  }));
/** 구매 화면 검토용 메모리 상태. 개인정보와 서버 응답을 영구 저장하지 않는다. */
export const usePurchasePreviewStore = create<PurchasePreviewState>((set) => ({
  lines: [],
  checkoutLines: [],
  setLines: (lines) => set({ lines: copyLines(lines) }),
  beginCheckout: (lines) =>
    set({
      checkoutLines: copyLines(
        lines.filter((line) => line.selected && !line.soldOut),
      ),
    }),
  resetPreview: () => set({ lines: [], checkoutLines: [] }),
}));
