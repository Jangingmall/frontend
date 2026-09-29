"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  deleteCartItem,
  mergeGuestCart,
  updateCartOptions,
  updateCartQuantity,
} from "@/api/cart/api";

import { cartKeys } from "./keys";
export function useCartMutations() {
  const client = useQueryClient();
  const onSettled = () => client.invalidateQueries({ queryKey: cartKeys.all });
  return {
    options: useMutation({ mutationFn: updateCartOptions, onSettled }),
    quantity: useMutation({ mutationFn: updateCartQuantity, onSettled }),
    remove: useMutation({ mutationFn: deleteCartItem, onSettled }),
    add: useMutation({ mutationFn: addCartItem, onSettled }),
  };
}
export function useMergeGuestCartMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: mergeGuestCart,
    onSuccess: () => client.invalidateQueries({ queryKey: cartKeys.all }),
  });
}
