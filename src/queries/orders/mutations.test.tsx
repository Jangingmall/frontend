import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { orderFixtures } from "@/api/orders/mock/fixtures";

import { orderKeys } from "./keys";
import { useRequestOrderCancelMutation } from "./mutations";

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useRequestOrderCancelMutation", () => {
  it("성공 시 상세뿐 아니라 목록·상태 요약도 함께 무효화한다(CodeRabbit 리뷰)", async () => {
    const orderId = orderFixtures.find(
      (order) => order.status === "CREATED",
    )!.orderId;
    const client = createClient();
    client.setQueryData(orderKeys.detail(orderId), {});
    client.setQueryData(orderKeys.statusSummary, {});

    const { result } = renderHook(
      () => useRequestOrderCancelMutation(orderId),
      { wrapper: createWrapper(client) },
    );
    result.current.mutate({ reason: "단순 변심", photos: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryState(orderKeys.detail(orderId))?.isInvalidated).toBe(
      true,
    );
    expect(client.getQueryState(orderKeys.statusSummary)?.isInvalidated).toBe(
      true,
    );
  });
});
