"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  cancelOrder,
  changeOrderAddress,
  type ChangeOrderAddressRequest,
  confirmPurchase,
} from "@/api/orders/api";

import { orderKeys } from "./keys";

/**
 * 주문 상세(`/mypage/orders/[orderId]`) 전용 mutation 3종. 전부 목업 전용 엔드포인트다
 * (T-28 design.md §8 — `be-requests.md` #6·#7) — 성공 시 상세 쿼리를 무효화해 최신 상태를
 * 다시 그린다.
 */

/** 주문 취소(입금 확인 중 상태 전용). */
export function useCancelOrderMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
    },
  });
}

/** 구매 확정(배송 완료 상태 전용). */
export function useConfirmPurchaseMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => confirmPurchase(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
    },
  });
}

/** 주문 배송지 변경(입금 확인 중·상품 준비 중 상태 전용). */
export function useChangeOrderAddressMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChangeOrderAddressRequest) =>
      changeOrderAddress(orderId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
    },
  });
}
