import { create } from "zustand";

import type {
  CartPreviewLine,
  PurchasePreviewState,
} from "@/types/purchase-preview";

import { useAuthStore } from "./auth";
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
export const usePurchasePreviewStore = create<PurchasePreviewState>(
  (set, get) => ({
    lines: [],
    checkoutLines: [],
    setLines: (lines) => set({ lines: copyLines(lines) }),
    addLines: (lines) => {
      const existing = get().lines;
      const ids = new Set(existing.map((line) => line.lineId));
      const added = lines.filter((line) => {
        if (ids.has(line.lineId)) return false;
        ids.add(line.lineId);
        return true;
      });
      if (added.length) set({ lines: [...existing, ...copyLines(added)] });
      return added.length === 0;
    },
    beginCheckout: (lines) =>
      set({
        checkoutLines: copyLines(
          lines.filter((line) => line.selected && !line.soldOut),
        ),
      }),
    resetPreview: () => set({ lines: [], checkoutLines: [] }),
  }),
);

// 사용자 전환 시 이전 고객의 구매 시연 데이터를 남기지 않는다.
useAuthStore.subscribe((state, previous) => {
  if (previous.user?.id != null && state.user?.id !== previous.user.id)
    usePurchasePreviewStore.getState().resetPreview();
});
