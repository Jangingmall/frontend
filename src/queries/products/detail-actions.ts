"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addProductToCart,
  fetchProductActionState,
  requestProductRestock,
  setProductWishlist,
} from "@/api/products/detail-actions";
import type {
  ProductActionState,
  ProductCartLine,
} from "@/api/products/detail-actions-validation";
import { publicEnv } from "@/lib/env";

export function useProductActions(
  productId: number,
  userId: number | null,
  enabled: boolean,
) {
  const client = useQueryClient();
  const queryKey = ["product-detail-actions", userId, productId] as const;
  const state = useQuery({
    queryKey,
    queryFn: () => fetchProductActionState(productId),
    enabled: enabled && userId !== null && publicEnv.apiMocking,
    retry: false,
  });
  const wishlist = useMutation({
    mutationFn: (wished: boolean) => setProductWishlist(productId, wished),
    onMutate: async (wished) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ProductActionState>(queryKey);
      client.setQueryData(queryKey, {
        restockRequested: false,
        ...previous,
        wished,
      });
      return { previous };
    },
    onError: (_error, _wished, context) => {
      client.setQueryData(
        queryKey,
        context?.previous ?? { wished: false, restockRequested: false },
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey }),
  });
  const cart = useMutation({
    mutationFn: (lines: ProductCartLine[]) =>
      addProductToCart(productId, lines),
  });
  const restock = useMutation({
    mutationFn: () => requestProductRestock(productId),
    onSuccess: () => client.invalidateQueries({ queryKey }),
  });
  return { state, wishlist, cart, restock };
}
