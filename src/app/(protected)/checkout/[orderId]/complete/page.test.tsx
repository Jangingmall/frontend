import { beforeEach, expect, it, vi } from "vitest";

import OrderCompleteRoutePage from "./page";

const environment = vi.hoisted(() => ({ apiMocking: false }));
vi.mock("@/lib/env", () => ({ publicEnv: environment }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("./_components/OrderCompleteRoute", () => ({
  OrderCompleteRoute: () => null,
}));
vi.mock("./_components/RealOrderComplete", () => ({
  RealOrderComplete: () => null,
}));
beforeEach(() => {
  environment.apiMocking = false;
});
it("allows only the reserved demo completion ID in API mode", async () => {
  const page = await OrderCompleteRoutePage({
    params: Promise.resolve({ orderId: "ui-preview-order" }),
    searchParams: Promise.resolve({ result: "success" }),
  });
  expect(page.props.outcome).toBe("success");
  await expect(
    OrderCompleteRoutePage({
      params: Promise.resolve({ orderId: "arbitrary-order" }),
      searchParams: Promise.resolve({ result: "success" }),
    }),
  ).rejects.toThrow("NOT_FOUND");
});
it("retains preview completion only in mock mode", async () => {
  environment.apiMocking = true;
  const page = await OrderCompleteRoutePage({
    params: Promise.resolve({ orderId: "ui-preview-order" }),
    searchParams: Promise.resolve({ result: "bank-pending" }),
  });
  expect(page.props.outcome).toBe("bank-pending");
});
it("reads actual order completion through the server-backed component", async () => {
  const page = await OrderCompleteRoutePage({
    params: Promise.resolve({ orderId: "42" }),
    searchParams: Promise.resolve({ result: "success" }),
  });
  expect(page.props.orderId).toBe(42);
  expect(page.props.outcome).toBeUndefined();
});
