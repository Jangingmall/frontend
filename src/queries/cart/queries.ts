"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCart } from "@/api/cart/api";

import { cartKeys } from "./keys";

export function useCartQuery(enabled = true, identity = "guest") {
  return useQuery({
    queryKey: cartKeys.detail(identity),
    queryFn: fetchCart,
    enabled,
  });
}
