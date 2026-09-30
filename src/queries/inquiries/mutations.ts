import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createInquiry } from "@/api/inquiries/api";
import { createDemoInquiry } from "@/api/inquiries/demo-api";
import { startMockWorker } from "@/mocks/start-browser";
import type { InquiryInput } from "@/types/inquiry";

import { inquiryKeys } from "./keys";

export function useCreateInquiry(productId: number, isMock: boolean) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: InquiryInput) => {
      await startMockWorker();
      return isMock
        ? createDemoInquiry(productId, input)
        : createInquiry(productId, input, false);
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: inquiryKeys.product(productId) }),
  });
}
