"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadReviewPhoto } from "@/api/images/api";
import { createReview } from "@/api/reviews/api";
import { orderKeys } from "@/queries/orders/keys";
import type { ReviewFormInput } from "@/types/review";

import { reviewKeys } from "./keys";

interface CreateReviewVariables {
  productId: number;
  orderItemId: number;
  input: ReviewFormInput;
}

/**
 * 후기 작성 — 사진을 먼저 업로드해 이미지 id를 모은 뒤 실제 작성 API를 호출한다. 성공하면
 * 주문(`reviewId` 채워짐)·후기 목록 둘 다 무효화한다.
 */
export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      orderItemId,
      input,
    }: CreateReviewVariables) => {
      const images = await Promise.all(
        input.photos.map((file) => uploadReviewPhoto(file)),
      );
      await createReview(productId, {
        orderItemId,
        rating: input.rating,
        content: input.content,
        images,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      void queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
