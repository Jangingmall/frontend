import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";

import { inquiryHandlers } from "@/api/inquiries/mock/handlers";
import { reviewHandlers } from "@/api/reviews/mock/handlers";
import { server } from "@/mocks/server";
import { startMockWorker } from "@/mocks/start-browser";
import { useProductInquiries } from "@/queries/inquiries/queries";

import { useProductReviews } from "./queries";

vi.mock("@/mocks/start-browser", () => ({ startMockWorker: vi.fn() }));

it("후기와 문의의 최초 요청은 목업 워커 준비가 끝난 뒤 시작한다", async () => {
  server.use(...reviewHandlers, ...inquiryHandlers);
  let ready!: () => void;
  vi.mocked(startMockWorker).mockReturnValue(
    new Promise<void>((resolve) => {
      ready = resolve;
    }),
  );
  const fetch = vi.spyOn(globalThis, "fetch");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { result } = renderHook(
    () => ({
      reviews: useProductReviews(
        101,
        { page: 1, sort: "latest", photoOnly: false },
        true,
      ),
      inquiries: useProductInquiries(101, false, true, null),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  await waitFor(() => expect(startMockWorker).toHaveBeenCalledTimes(2));
  expect(fetch).not.toHaveBeenCalled();
  await act(async () => ready());
  await waitFor(() => {
    expect(result.current.reviews.isSuccess).toBe(true);
    expect(result.current.inquiries.isSuccess).toBe(true);
  });
});
