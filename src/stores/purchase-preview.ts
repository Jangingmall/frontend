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
/** UI-only memory; never persists personal data or server responses. */
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
