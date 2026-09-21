"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addWish, removeWish } from "@/api/wishlist/api";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { wishlistKeys } from "./keys";

/**
 * 찜 목록 화면(`/mypage/wishlist`) 전용 — 화면에 보이는 항목은 전부 이미 찜된 상태라
 * 항상 해제만 한다. 낙관적 업데이트로 해당 페이지 캐시에서 즉시 제거하고(실패 확률이
 * 낮고 즉시성이 중요한 상호작용, `data-layer.md` §6.6), 실패 시 롤백한다.
 */
export function useRemoveWishMutation(page: number) {
  const client = useQueryClient();
  const queryKey = wishlistKeys.list(page);
  return useMutation({
    mutationFn: (productId: number) => removeWish(productId),
    onMutate: async (productId: number) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<Page<ProductSummary>>(queryKey);
      if (previous) {
        client.setQueryData<Page<ProductSummary>>(queryKey, {
          ...previous,
          items: previous.items.filter((item) => item.id !== productId),
          totalCount: Math.max(0, previous.totalCount - 1),
        });
      }
      return { previous };
    },
    onError: (_error, _productId, context) => {
      if (context?.previous) client.setQueryData(queryKey, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: wishlistKeys.all }),
  });
}

/**
 * 최근 본 상품 화면(`/mypage/recent`) 전용 — 항목이 목록에서 사라지지 않고(찜 여부와
 * 무관하게 "최근 봄" 기록은 유지) 하트 상태만 바뀌므로, 낙관적 스냅샷/롤백 없이
 * 무효화만으로 충분하다.
 */
export function useToggleWishMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      wished,
    }: {
      productId: number;
      wished: boolean;
    }) => (wished ? removeWish(productId) : addWish(productId)),
    onSuccess: () => client.invalidateQueries({ queryKey: wishlistKeys.all }),
  });
}
