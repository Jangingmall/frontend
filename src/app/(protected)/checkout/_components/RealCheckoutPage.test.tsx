import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/http/api-error";

import { RealCheckoutPage } from "./RealCheckoutPage";
const state = vi.hoisted(() => ({
  soldOut: false,
  total: 1000,
  create: vi.fn(),
  prepare: vi.fn(),
  request: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("items=1"),
}));
vi.mock("@tosspayments/tosspayments-sdk", () => ({
  ANONYMOUS: "anonymous",
  loadTossPayments: async () => ({
    payment: () => ({ requestPayment: state.request }),
  }),
}));
vi.mock("@/queries/cart", () => ({
  useCartQuery: () => ({
    data: {
      lines: [
        {
          lineId: "1",
          productId: 1,
          artisanId: 1,
          productName: "상품",
          unitPrice: 1000,
          quantity: 1,
          options: [],
          soldOut: state.soldOut,
        },
      ],
      sections: [],
    },
  }),
}));
vi.mock("@/types/cart", () => ({ getCartShippingAmount: () => 0 }));
vi.mock("@/queries/member/queries", () => ({
  useAddressesQuery: () => ({
    data: [
      {
        id: 2,
        recipientName: "받는분",
        phone: "01012345678",
        address1: "주소",
        address2: "상세",
        isDefault: true,
      },
    ],
  }),
}));
vi.mock("@/queries/member/mutations", () => ({
  useCreateAddressMutation: () => ({}),
}));
vi.mock("@/queries/payments", () => ({
  useCreateOrderMutation: () => ({ mutateAsync: state.create }),
  usePreparePaymentMutation: () => ({ mutateAsync: state.prepare }),
}));
vi.mock("./CheckoutProducts", () => ({ CheckoutProducts: () => null }));
vi.mock("@/components/order/PaymentsMethod", () => ({
  PaymentsMethod: ({ onChange }: { onChange: (value: string) => void }) => (
    <button onClick={() => onChange("CARD")}>카드 선택</button>
  ),
}));
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  state.soldOut = false;
  state.total = 1000;
  state.create.mockImplementation(async () => ({
    orderId: 42,
    orderNumber: "ORD-12345",
    totalAmount: state.total,
    status: "CREATED",
  }));
  state.prepare.mockResolvedValue({
    orderId: 42,
    amount: 1000,
    tossClientKey: "",
  });
});
function fill() {
  fireEvent.click(screen.getByText("카드 선택"));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
}
it("never reserves an order on render or invalid submit", () => {
  render(<RealCheckoutPage />);
  expect(state.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  expect(state.create).not.toHaveBeenCalled();
});
it("blocks sold out selection before reserving stock", () => {
  state.soldOut = true;
  render(<RealCheckoutPage />);
  fill();
  expect(state.create).not.toHaveBeenCalled();
});
it("reports unconfigured gateway without fabricating success", async () => {
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("결제 서비스 설정"),
  );
  expect(state.request).not.toHaveBeenCalled();
});
it("requires explicit reconfirmation before charging a server-changed total", async () => {
  state.total = 1200;
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("1,200원으로 변경"),
  );
  expect(state.prepare).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "1,200원 확인 후 결제" }),
  ).toBeVisible();
});
it("shows backend business failure details when gateway configuration is missing", async () => {
  state.prepare.mockRejectedValueOnce(
    new ApiError(422, {
      errorCode: "BUSINESS_RULE_VIOLATION",
      message: "토스페이먼츠 클라이언트 키가 설정되지 않았습니다.",
    }),
  );
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "토스페이먼츠 클라이언트 키가 설정되지 않았습니다.",
    ),
  );
  expect(state.request).not.toHaveBeenCalled();
});
