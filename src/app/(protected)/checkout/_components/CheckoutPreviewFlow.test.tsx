import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { getProductDetailMock } from "@/api/products/mock/detail-fixtures";
import { OrderCompleteRoute } from "@/app/(protected)/checkout/[orderId]/complete/_components/OrderCompleteRoute";
import { toCartPreviewLines } from "@/app/products/[productSlug]/_lib/purchase-preview";
import { createSelection } from "@/app/products/[productSlug]/_lib/purchase-selection";
import { createRuntimeHandlers } from "@/mocks/runtime-handlers";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { CheckoutPage } from "./CheckoutPage";
import { PreviewPaymentReturn } from "./PreviewPaymentReturn";

const { openPayment, router } = vi.hoisted(() => ({
  openPayment: vi.fn(),
  router: { push: vi.fn(), replace: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/app/(protected)/checkout/_lib/toss-preview", () => ({
  openPreviewPayment: openPayment,
}));
vi.mock("@/lib/env", async (original) => {
  const actual = await original<typeof import("@/lib/env")>();
  return { ...actual, publicEnv: { ...actual.publicEnv, apiMocking: false } };
});

beforeEach(() => {
  vi.clearAllMocks();
  openPayment.mockResolvedValue(undefined);
  sessionStorage.clear();
  useAuthStore.getState().clear();
  usePurchasePreviewStore.getState().resetPreview();
  server.use(...createRuntimeHandlers("api"));
});

function teacupLines() {
  const product = getProductDetailMock(900002)!;
  const choices = Object.fromEntries(
    product.optionGroups.map((group) => [group.id, group.values[0].id]),
  );
  return toCartPreviewLines(product, [createSelection(product, choices)!]);
}

it("API 게스트의 찻잔 MSW 주문 금액을 토스로 전달하고 복귀 후 완료·실제 주문내역으로 연결한다", async () => {
  const lines = teacupLines();
  const { unmount } = render(
    <CheckoutPage
      lines={lines}
      initialMethod="TOSS_PAY"
      initialValues={{
        customerName: "시연고객",
        email: "preview@example.com",
        customerPhoneMiddle: "0000",
        customerPhoneLast: "0000",
        recipientName: "시연고객",
        recipientPhoneMiddle: "0000",
        recipientPhoneLast: "0000",
        postcode: "04524",
        address: "서울특별시 중구 세종대로 110",
      }}
    />,
  );
  fireEvent.click(screen.getByRole("checkbox", { name: "약관에 동의합니다." }));
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  await waitFor(() => expect(openPayment).toHaveBeenCalledOnce());
  const payment = openPayment.mock.calls[0][0];
  expect(payment).toEqual({
    method: "TOSSPAY",
    amount: 120000,
    orderId: expect.stringMatching(/^demo-/),
    orderName: "청자 분청 찻잔",
    successUrl: `${window.location.origin}/checkout/ui-preview-order?paymentResult=success`,
    failUrl: `${window.location.origin}/checkout/ui-preview-order?paymentResult=fail`,
  });
  expect(JSON.parse(sessionStorage.getItem("preview-payment")!)).toEqual({
    orderId: payment.orderId,
    amount: 120000,
    lines,
  });
  unmount();
  // 외부 결제창에서 돌아오면서 메모리 상태가 초기화된 경우에도 상품을 복원한다.
  usePurchasePreviewStore.getState().resetPreview();
  const returned = render(
    <PreviewPaymentReturn
      result="success"
      orderId={payment.orderId}
      amount="120000"
      paymentKey="test-payment-key"
    />,
  );
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith(
      "/checkout/ui-preview-order/complete?result=success",
    ),
  );
  expect(usePurchasePreviewStore.getState().checkoutLines).toEqual(lines);
  expect(usePurchasePreviewStore.getState().checkoutTotal).toBe(120000);
  expect(sessionStorage.getItem("preview-payment")).toBeNull();
  returned.unmount();
  render(<OrderCompleteRoute outcome="success" />);
  expect(
    screen.getByRole("heading", { name: "주문이 완료되었습니다" }),
  ).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "주문 내역 보기" }));
  expect(router.push).toHaveBeenCalledWith("/mypage/orders");
  expect(useAuthStore.getState().accessToken).toBeNull();
});

it.each([
  {
    result: "fail",
    orderId: "demo-teacup",
    amount: "120000",
    paymentKey: "test-key",
  },
  {
    result: "success",
    orderId: "demo-other",
    amount: "120000",
    paymentKey: "test-key",
  },
  {
    result: "success",
    orderId: "demo-teacup",
    amount: "1",
    paymentKey: "test-key",
  },
  {
    result: "success",
    orderId: "demo-teacup",
    amount: "120000",
    paymentKey: undefined,
  },
])("취소·불일치 결제 복귀는 완료로 처리하지 않는다: %j", (props) => {
  sessionStorage.setItem(
    "preview-payment",
    JSON.stringify({
      orderId: "demo-teacup",
      amount: 120000,
      lines: teacupLines(),
    }),
  );
  render(<PreviewPaymentReturn {...props} />);
  expect(router.replace).not.toHaveBeenCalled();
  expect(usePurchasePreviewStore.getState().checkoutLines).toEqual([]);
  expect(
    screen.getByRole("link", { name: "주문서로 돌아가기" }),
  ).toHaveAttribute("href", "/checkout/ui-preview-order");
});
