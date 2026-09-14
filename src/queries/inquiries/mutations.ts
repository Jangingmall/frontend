import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createInquiry } from "@/api/inquiries/api";
import { startMockWorker } from "@/mocks/start-browser";
import type { InquiryInput } from "@/types/inquiry";

import { inquiryKeys } from "./keys";

export function useCreateInquiry(productId: number, isMock: boolean) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: InquiryInput) => {
      await startMockWorker();
      return createInquiry(productId, input, isMock);
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: inquiryKeys.product(productId) }),
  });
}
