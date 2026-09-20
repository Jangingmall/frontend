import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/http/api-error";

import { RealCheckoutPage } from "./RealCheckoutPage";
const state = vi.hoisted(() => ({
  soldOut: false,
  unavailable: false,
  empty: false,
  total: 1000,
  saveAddress: vi.fn(),
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
    isError: state.unavailable,
    data: state.unavailable
      ? undefined
      : {
          lines: state.empty
            ? []
            : [
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
  useMemberProfileQuery: () => ({
    data: { name: "주문자", email: "buyer@example.com", phone: "01012345678" },
  }),
  useAddressesQuery: () => ({
    data: [
      {
        id: 2,
        recipientName: "받는분",
        phone: "01012345678",
        zipCode: "12345",
        address1: "주소",
        address2: "상세",
        isDefault: true,
      },
    ],
  }),
}));
vi.mock("@/queries/member/mutations", () => ({
  useCreateAddressMutation: () => ({ mutateAsync: state.saveAddress }),
}));
vi.mock("@/queries/payments", () => ({
  useCreateOrderMutation: () => ({ mutateAsync: state.create }),
  usePreparePaymentMutation: () => ({ mutateAsync: state.prepare }),
}));
vi.mock("./CheckoutProducts", () => ({ CheckoutProducts: () => null }));
vi.mock("@/components/order/PaymentsMethod", () => ({
  PaymentsMethod: ({ onChange }: { onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange("CARD")}>
      카드 선택
    </button>
  ),
}));
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
  state.soldOut = false;
  state.unavailable = false;
  state.empty = false;
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
  fireEvent.click(screen.getByRole("checkbox", { name: "약관에 동의합니다." }));
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

it.each(["empty", "unavailable"] as const)(
  "preserves the full checkout layout on %s data without allowing payment",
  (mode) => {
    state[mode] = true;
    render(<RealCheckoutPage />);
    for (const title of [
      "주문 고객",
      "배송 정보",
      "할인/부가결제",
      "이용 및 정보 제공 약관",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "결제하기" })).toBeDisabled();
    expect(state.create).not.toHaveBeenCalled();
  },
);
it("shows member and shipping API values in the design fields", () => {
  render(<RealCheckoutPage />);
  expect(screen.getByRole("textbox", { name: "주문자 이름" })).toHaveValue(
    "주문자",
  );
  expect(screen.getByRole("textbox", { name: "수령인 이름" })).toHaveValue(
    "받는분",
  );
  expect(screen.getByRole("textbox", { name: "기본주소" })).toHaveValue("주소");
});

it("saves edited shipping fields and uses the returned address ID for the order", async () => {
  state.saveAddress.mockImplementation(async (input) => ({ ...input, id: 7 }));
  render(<RealCheckoutPage />);
  fireEvent.change(screen.getByRole("textbox", { name: "상세주소" }), {
    target: { value: "새 상세주소" },
  });
  fill();
  await waitFor(() => expect(state.create).toHaveBeenCalled());
  expect(state.saveAddress).toHaveBeenCalledWith(
    expect.objectContaining({ address2: "새 상세주소", phone: "01012345678" }),
  );
  expect(state.create.mock.calls[0][0].input.addressId).toBe(7);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  await waitFor(() => expect(state.create).toHaveBeenCalledTimes(2));
  expect(state.saveAddress).toHaveBeenCalledTimes(1);
  expect(state.create.mock.calls[1][0].key).toBe(
    state.create.mock.calls[0][0].key,
  );
});
it("does not reserve stock when saving an edited address fails", async () => {
  state.saveAddress.mockRejectedValue(
    new Error("배송지를 저장하지 못했습니다."),
  );
  render(<RealCheckoutPage />);
  fireEvent.change(screen.getByRole("textbox", { name: "수령인 이름" }), {
    target: { value: "새 수령인" },
  });
  fill();
  await screen.findByRole("alert");
  expect(state.create).not.toHaveBeenCalled();
});
