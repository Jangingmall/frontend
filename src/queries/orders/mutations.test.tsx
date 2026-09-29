import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { fetchOrdersList } from "@/api/orders/api";
import { orderFixtures } from "@/api/orders/mock/fixtures";

import { orderKeys } from "./keys";
import {
  useConfirmPurchaseMutation,
  useRequestOrderCancelMutation,
} from "./mutations";

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

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

it("구매 확정 완료 시 비활성 주문 목록도 갱신되어 뒤로가기로 이전 상태를 보이지 않는다", async () => {
  const orderId = orderFixtures.find(
    (order) => order.status === "DELIVERED",
  )!.orderId;
  const client = createClient();
  const query = { size: 100 };
  const queryKey = orderKeys.list(query);
  await client.fetchQuery({ queryKey, queryFn: () => fetchOrdersList(query) });
  const status = () =>
    client
      .getQueryData<Awaited<ReturnType<typeof fetchOrdersList>>>(queryKey)
      ?.items.find((order) => order.orderId === orderId)?.items[0]?.status;
  expect(status()).toBe("DELIVERED");
  const { result } = renderHook(() => useConfirmPurchaseMutation(orderId), {
    wrapper: createWrapper(client),
  });
  await result.current.mutateAsync();
  expect(status()).toBe("PURCHASE_CONFIRMED");
});

it("구매 확정 실패 시 주문 목록 상태를 유지한다", async () => {
  const orderId = orderFixtures.find(
    (order) => order.status === "PAID",
  )!.orderId;
  const client = createClient();
  const query = { size: 100 };
  const queryKey = orderKeys.list(query);
  const before = await client.fetchQuery({
    queryKey,
    queryFn: () => fetchOrdersList(query),
  });
  const { result } = renderHook(() => useConfirmPurchaseMutation(orderId), {
    wrapper: createWrapper(client),
  });
  await expect(result.current.mutateAsync()).rejects.toMatchObject({
    status: 422,
  });
  expect(client.getQueryData(queryKey)).toEqual(before);
});
