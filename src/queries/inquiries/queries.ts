import { useQuery } from "@tanstack/react-query";

import { fetchDemoInquiries } from "@/api/inquiries/demo-api";
import { startMockWorker } from "@/mocks/start-browser";

import { inquiryKeys } from "./keys";

export function useProductInquiries(
  id: number,
  excludeSecret: boolean,
  isMock: boolean,
  viewerId: number | null,
) {
  return useQuery({
    queryKey: inquiryKeys.list(id, excludeSecret, viewerId, isMock),
    queryFn: async () => {
      await startMockWorker();
      return fetchDemoInquiries(id, excludeSecret, viewerId !== null);
    },
    enabled: isMock,
    gcTime: 0,
  });
}
