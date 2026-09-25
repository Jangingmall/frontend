"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadReturnPhoto } from "@/api/images/api";
import {
  changeOrderAddress,
  type ChangeOrderAddressRequest,
  confirmPurchase,
  requestOrderCancel,
  requestOrderExchangeRefund,
} from "@/api/orders/api";
import { ORDER_RETURN_REASON_MAP } from "@/constants/order";
import { publicEnv } from "@/lib/env";
import { memberKeys } from "@/queries/member/keys";
import { reviewKeys } from "@/queries/reviews/keys";
import type {
  OrderCancelRequest,
  OrderExchangeRefundRequest,
} from "@/types/order";

import { orderKeys } from "./keys";

/**
 * 주문 도메인 mutation 모음. 취소·교환환불 요청은 목록(MY-1/MY-2)·상세(주문 상세) 양쪽에서
 * 쓴다(주문 취소·교환환불 신청 모달 공용 — `components/order/`). 구매 확정도 목록과 상세에서 공유한다.
 * 목록·상태 요약이 읽는 공유 fixture/서버 데이터도 같이 바뀌므로 전부 `orderKeys.all`
 * (접두사 `["orders"]`)까지 무효화한다(CodeRabbit 리뷰 — 기존 취소 mutation과 동일 원칙).
 */

/**
 * 실제 취소 API가 받지 않는 첨부 파일은 업로드하지 않는다. MSW 시연은 유지한다.
 */
export function useRequestOrderCancelMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrderCancelRequest) => {
      const imageIds = publicEnv.apiMocking
        ? await Promise.all(input.photos.map(uploadReturnPhoto))
        : [];
      await requestOrderCancel(orderId, { reason: input.reason, imageIds });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/**
 * 교환·환불 신청 — 실제 BE 계약(`POST /api/payments/returns`)대로 동작한다. 사진을 먼저 다
 * 업로드해 `imageId`를 모은 뒤 신청을 제출한다.
 */
export function useRequestOrderExchangeRefundMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: OrderExchangeRefundRequest) => {
      const imageIds = await Promise.all(input.photos.map(uploadReturnPhoto));
      const reason = ORDER_RETURN_REASON_MAP[input.reasonLabel] ?? "OTHER";
      const description =
        reason === "OTHER"
          ? (input.description ?? input.reasonLabel)
          : input.description;
      await requestOrderExchangeRefund(orderId, {
        type: input.type,
        orderItemId: input.orderItemId,
        reason,
        description,
        imageIds,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** 구매 확정(배송 완료 상태 전용). */
export function useConfirmPurchaseMutation(orderId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => confirmPurchase(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
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
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: memberKeys.addresses() });
    },
  });
}
