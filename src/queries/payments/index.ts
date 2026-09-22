"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  confirmPayment,
  createOrder,
  failPayment,
  fetchPaymentOrder,
  preparePayment,
} from "@/api/payments/api";
import { cartKeys } from "@/queries/cart/keys";
import { orderKeys } from "@/queries/orders/keys";
import type { CreateOrderInput } from "@/types/payment";

import { paymentKeys } from "./keys";
export function useCreateOrderMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, key }: { input: CreateOrderInput; key: string }) =>
      createOrder(input, key),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: orderKeys.all });
    },
    retry: false,
  });
}
export function usePreparePaymentMutation() {
  return useMutation({ mutationFn: preparePayment, retry: false });
}
export function useConfirmPaymentMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: confirmPayment,
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: paymentKeys.all });
      void client.invalidateQueries({ queryKey: cartKeys.all });
      void client.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
export function useFailPaymentMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: failPayment,
    retry: false,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: paymentKeys.all });
      void client.invalidateQueries({ queryKey: orderKeys.all });
      void client.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
export function usePaymentOrderQuery(id: number, identity: string) {
  return useQuery({
    queryKey: paymentKeys.order(identity, id),
    queryFn: () => fetchPaymentOrder(id),
    enabled: Number.isSafeInteger(id) && id > 0,
    staleTime: 0,
    retry: false,
  });
}
