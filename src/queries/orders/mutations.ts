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

/**
 * 주문 취소(입금 확인 중 상태 전용). 취소는 목록·상태 요약이 읽는 공유 fixture 상태도
 * 바꾸므로(mock handler) 상세뿐 아니라 `orderKeys.all`(접두사 `["orders"]`)까지 무효화해야
 * 목록·상태 요약이 낡은 값으로 남지 않는다(CodeRabbit 리뷰).
 */
export function useCancelOrderMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: orderKeys.all,
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
