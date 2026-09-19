import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { savePaymentContext } from "@/app/(protected)/checkout/_lib/checkout-session";

import { PaymentCallback } from "./PaymentCallback";
const state = vi.hoisted(() => ({
  params: new URLSearchParams(),
  confirm: vi.fn(),
  fail: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => state.params,
  useRouter: () => ({ replace: state.replace }),
}));
vi.mock("@/queries/payments", () => ({
  useConfirmPaymentMutation: () => ({ mutateAsync: state.confirm }),
  useFailPaymentMutation: () => ({ mutateAsync: state.fail }),
}));
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  state.params = new URLSearchParams(
    "orderId=ORD-12345&amount=5000&paymentKey=key",
  );
});
it("confirms with gateway order number after reload then navigates using numeric order ID", async () => {
  savePaymentContext({ orderId: 42, orderNumber: "ORD-12345", amount: 5000 });
  state.confirm.mockResolvedValue({
    orderId: 42,
    orderNumber: "ORD-12345",
    amount: 5000,
    status: "DONE",
  });
  render(<PaymentCallback />);
  await waitFor(() =>
    expect(state.replace).toHaveBeenCalledWith("/checkout/42/complete"),
  );
  expect(state.confirm).toHaveBeenCalledExactlyOnceWith({
    orderId: "ORD-12345",
    paymentKey: "key",
    amount: 5000,
  });
});
it("does not confirm if context is absent or amount is altered", async () => {
  savePaymentContext({ orderId: 42, orderNumber: "ORD-12345", amount: 1 });
  render(<PaymentCallback />);
  await screen.findByRole("alert");
  expect(state.confirm).not.toHaveBeenCalled();
  expect(state.replace).not.toHaveBeenCalled();
});
it("shows approval failures instead of fabricated completion", async () => {
  savePaymentContext({ orderId: 42, orderNumber: "ORD-12345", amount: 5000 });
  state.confirm.mockRejectedValue(new Error("결제 승인 실패"));
  render(<PaymentCallback />);
  expect(await screen.findByRole("alert")).toHaveTextContent("결제 승인 실패");
  expect(state.replace).not.toHaveBeenCalled();
});
it("records cancellation using backend fail fields", async () => {
  savePaymentContext({ orderId: 42, orderNumber: "ORD-12345", amount: 5000 });
  state.params = new URLSearchParams(
    "orderId=ORD-12345&code=USER_CANCEL&message=취소",
  );
  state.fail.mockResolvedValue(undefined);
  render(<PaymentCallback failure />);
  await screen.findByRole("alert");
  expect(state.fail).toHaveBeenCalledExactlyOnceWith({
    orderId: "ORD-12345",
    errorCode: "USER_CANCEL",
    errorMessage: "취소",
  });
  expect(state.confirm).not.toHaveBeenCalled();
});
