import { beforeEach, expect, it, vi } from "vitest";

import { openTossWidget } from "./toss-widget";

const sdk = vi.hoisted(() => ({
  load: vi.fn(),
  widgets: vi.fn(),
  setAmount: vi.fn(),
  render: vi.fn(),
  request: vi.fn(),
  destroy: vi.fn(),
  handlers: {} as Record<
    string,
    (value?: { paymentMethod: { code: string } }) => Promise<void>
  >,
}));
vi.mock("@tosspayments/tosspayments-sdk", () => ({
  ANONYMOUS: "anonymous",
  loadTossPayments: sdk.load,
}));
const input = {
  clientKey: "test_gck_fixture",
  amount: 1000,
  orderId: "ORDER-123",
  orderName: "상품",
  successUrl: "https://shop.test/payments/success",
  failUrl: "https://shop.test/payments/fail",
  method: "TOSSPAY" as const,
};
beforeEach(() => {
  vi.resetAllMocks();
  sdk.handlers = {};
  sdk.destroy.mockResolvedValue(undefined);
  sdk.load.mockResolvedValue({ widgets: sdk.widgets });
  sdk.widgets.mockReturnValue({
    setAmount: sdk.setAmount,
    renderPaymentWindow: sdk.render,
    requestPayment: sdk.request,
  });
  sdk.render.mockResolvedValue({
    destroy: sdk.destroy,
    on: (
      event: string,
      cb: (value?: { paymentMethod: { code: string } }) => Promise<void>,
    ) => {
      sdk.handlers[event] = cb;
    },
  });
});
async function opened() {
  await vi.waitFor(() => expect(sdk.handlers.paymentRequest).toBeDefined());
}
it("uses the widget key, server amount and redirect callbacks", async () => {
  const pending = openTossWidget(input);
  await opened();
  expect(sdk.load).toHaveBeenCalledWith(input.clientKey);
  expect(sdk.setAmount).toHaveBeenCalledWith({ currency: "KRW", value: 1000 });
  expect(sdk.request).not.toHaveBeenCalled();
  await sdk.handlers.paymentRequest({ paymentMethod: { code: "TOSSPAY" } });
  await pending;
  expect(sdk.request).toHaveBeenCalledWith({
    orderId: input.orderId,
    orderName: input.orderName,
    successUrl: input.successUrl,
    failUrl: input.failUrl,
  });
  expect(sdk.destroy).toHaveBeenCalledOnce();
});
it("rejects a different method without sending payment", async () => {
  const pending = openTossWidget(input);
  const assertion = expect(pending).rejects.toThrow("토스페이");
  await opened();
  await sdk.handlers.paymentRequest({ paymentMethod: { code: "CARD" } });
  await assertion;
  expect(sdk.request).not.toHaveBeenCalled();
  expect(sdk.destroy).toHaveBeenCalledOnce();
});
it("releases the window on cancellation", async () => {
  const pending = openTossWidget(input);
  const assertion = expect(pending).rejects.toThrow("취소");
  await opened();
  await sdk.handlers.cancel();
  await assertion;
});
it("cleans up on SDK failure", async () => {
  sdk.request.mockRejectedValue(new Error("SDK failed"));
  const pending = openTossWidget(input);
  const assertion = expect(pending).rejects.toThrow("SDK failed");
  await opened();
  await sdk.handlers.paymentRequest({ paymentMethod: { code: "TOSSPAY" } });
  await assertion;
  expect(sdk.destroy).toHaveBeenCalledOnce();
});
it("does not call the SDK with an old individual key", async () => {
  await expect(
    openTossWidget({ ...input, clientKey: "test_ck_old" }),
  ).rejects.toThrow("설정");
  expect(sdk.load).not.toHaveBeenCalled();
});
it("closes the window when checkout unmounts", async () => {
  const controller = new AbortController();
  const pending = openTossWidget(input, controller.signal);
  const assertion = expect(pending).rejects.toThrow("취소");
  await opened();
  controller.abort();
  await assertion;
  expect(sdk.destroy).toHaveBeenCalledOnce();
});

it("ignores duplicate payment events while a request is pending", async () => {
  let finish!: () => void;
  sdk.request.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const pending = openTossWidget(input);
  await opened();
  const first = sdk.handlers.paymentRequest({
    paymentMethod: { code: "TOSSPAY" },
  });
  await sdk.handlers.paymentRequest({ paymentMethod: { code: "TOSSPAY" } });
  expect(sdk.request).toHaveBeenCalledTimes(1);
  finish();
  await first;
  await pending;
});
it("destroys a window that finishes rendering after checkout unmounts", async () => {
  let finish!: (value: unknown) => void;
  sdk.render.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const controller = new AbortController();
  const pending = openTossWidget(input, controller.signal);
  const assertion = expect(pending).rejects.toThrow("취소");
  await vi.waitFor(() => expect(sdk.render).toHaveBeenCalledOnce());
  controller.abort();
  finish({ destroy: sdk.destroy });
  await assertion;
  expect(sdk.destroy).toHaveBeenCalledOnce();
  expect(sdk.request).not.toHaveBeenCalled();
});
