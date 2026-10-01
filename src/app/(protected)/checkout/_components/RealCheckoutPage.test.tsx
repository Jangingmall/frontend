import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/http/api-error";

import { RealCheckoutPage } from "./RealCheckoutPage";
const state = vi.hoisted(() => ({
  selected: true,
  phone: "01012345678",
  loadSdk: vi.fn(),
  soldOut: false,
  unavailable: false,
  empty: false,
  total: 1000,
  saveAddress: vi.fn(),
  create: vi.fn(),
  prepare: vi.fn(),
  request: vi.fn(),
  postcode: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("items=1"),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@tosspayments/tosspayments-sdk", () => ({
  ANONYMOUS: "anonymous",
  loadTossPayments: async (key: string) => {
    state.loadSdk(key);
    return { payment: () => ({ requestPayment: state.request }) };
  },
}));
vi.mock("react-daum-postcode", () => ({
  useKakaoPostcodePopup: () => state.postcode,
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
                  artisanName: "장인",
                  thumbnail: { imageId: "test", variants: [] },
                  maxQuantity: Infinity,
                  productName: "상품",
                  unitPrice: 1000,
                  quantity: 1,
                  options: [],
                  soldOut: state.soldOut,
                  selected: state.selected,
                },
              ],
          sections: [],
        },
  }),
}));
vi.mock("@/types/cart", () => ({ getCartShippingAmount: () => 0 }));
vi.mock("@/queries/member/queries", () => ({
  useMemberProfileQuery: () => ({
    data: { name: "주문자", email: "buyer@example.com", phone: state.phone },
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
  PaymentsMethod: ({
    onChange,
    disabledMethods = [],
  }: {
    onChange: (value: string) => void;
    disabledMethods?: string[];
  }) => (
    <>
      <button
        type="button"
        disabled={disabledMethods.includes("BANK_TRANSFER")}
        onClick={() => onChange("BANK_TRANSFER")}
      >
        무통장 시연 선택
      </button>
      <button type="button" onClick={() => onChange("REALTIME_TRANSFER")}>
        계좌이체 선택
      </button>
      <button type="button" onClick={() => onChange("TOSS_PAY")}>
        토스페이 선택
      </button>
      <button type="button" onClick={() => onChange("CARD")}>
        카드 선택
      </button>
    </>
  ),
}));
beforeEach(() => {
  state.postcode.mockResolvedValue(undefined);
  state.selected = true;
  state.phone = "01012345678";
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
it("blocks a direct checkout URL for a server-unselected item", () => {
  state.selected = false;
  render(<RealCheckoutPage />);
  expect(screen.getByRole("button", { name: "결제하기" })).toBeDisabled();
  expect(
    screen.getByText(/선택한 장바구니 상품을 확인할 수 없습니다/),
  ).toBeVisible();
  expect(state.create).not.toHaveBeenCalled();
});
it("never reserves an order on render or invalid submit", () => {
  render(<RealCheckoutPage />);
  expect(state.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  expect(state.create).not.toHaveBeenCalled();
});
it("does not prepare payment when the server rejects unavailable stock", async () => {
  state.soldOut = true;
  state.create.mockRejectedValueOnce(new Error("재고가 부족합니다."));
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("재고가 부족합니다."),
  );
  expect(state.prepare).not.toHaveBeenCalled();
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
    for (const title of ["주문 고객", "배송 정보", "이용 및 정보 제공 약관"]) {
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
    expect.objectContaining({ address2: "새 상세주소", phone: state.phone }),
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
it("retries the same reserved order after its final stock becomes sold out", async () => {
  const view = render(<RealCheckoutPage />);
  fill();
  await waitFor(() => expect(state.prepare).toHaveBeenCalledTimes(1));
  const firstKey = state.create.mock.calls[0][0].key;
  view.unmount();
  state.soldOut = true;
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() => expect(state.prepare).toHaveBeenCalledTimes(2));
  expect(state.create.mock.calls[1][0].key).toBe(firstKey);
});

it("API checkout preserves the Figma benefit fields without mock discounts", () => {
  render(<RealCheckoutPage />);
  expect(
    screen.getByRole("button", { name: "무통장 시연 선택" }),
  ).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "할인코드" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "적립금" })).toBeInTheDocument();
  expect(screen.queryByText(/주문·결제 시연/)).not.toBeInTheDocument();
});
it("opens the real address search and fills the chosen address", async () => {
  state.postcode.mockImplementation(async ({ onComplete }) =>
    onComplete({
      zonecode: "04524",
      roadAddress: "서울특별시 중구 세종대로 110",
      address: "서울 중구 태평로1가 31",
    }),
  );
  render(<RealCheckoutPage />);
  fireEvent.click(screen.getByRole("button", { name: "주소검색" }));
  await waitFor(() => expect(state.postcode).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("textbox", { name: "우편번호" })).toHaveValue(
    "04524",
  );
  expect(screen.getByRole("textbox", { name: "기본주소" })).toHaveValue(
    "서울특별시 중구 세종대로 110",
  );
  expect(state.create).not.toHaveBeenCalled();
});
it("reports address search errors without inserting a dummy address", async () => {
  state.postcode.mockRejectedValueOnce(new Error("script failed"));
  render(<RealCheckoutPage />);
  fireEvent.click(screen.getByRole("button", { name: "주소검색" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "주소 검색을 열지 못했습니다",
    ),
  );
  expect(screen.getByRole("textbox", { name: "기본주소" })).toHaveValue("주소");
});
it("requests the Toss card window with the verified server order and amount", async () => {
  state.prepare.mockResolvedValueOnce({
    orderId: 42,
    amount: 1000,
    tossClientKey: "test_ck_fixture",
  });
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() =>
    expect(state.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "CARD",
        amount: { currency: "KRW", value: 1000 },
        orderId: "ORD-12345",
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      }),
    ),
  );
});
it("never opens the gateway for a mismatched prepared amount", async () => {
  state.prepare.mockResolvedValueOnce({
    orderId: 42,
    amount: 999,
    tossClientKey: "test_ck_fixture",
  });
  render(<RealCheckoutPage />);
  fill();
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "결제 금액을 확인할 수 없습니다",
    ),
  );
  expect(state.request).not.toHaveBeenCalled();
});

it.each([
  ["계좌이체 선택", "TRANSFER", "TRANSFER"],
  ["토스페이 선택", "EASY_PAY", "CARD"],
])(
  "opens %s using its real payment method",
  async (label, paymentMethod, gatewayMethod) => {
    state.prepare.mockResolvedValueOnce({
      orderId: 42,
      amount: 1000,
      tossClientKey: "test_ck_fixture",
    });
    render(<RealCheckoutPage />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    fireEvent.click(
      screen.getByRole("checkbox", { name: "약관에 동의합니다." }),
    );
    fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
    await waitFor(() => expect(state.request).toHaveBeenCalledTimes(1));
    expect(state.prepare).toHaveBeenCalledWith({
      orderId: 42,
      amount: 1000,
      paymentMethod,
    });
    expect(state.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: gatewayMethod }),
    );
    if (paymentMethod === "EASY_PAY")
      expect(state.request).toHaveBeenCalledWith(
        expect.objectContaining({
          card: { flowMode: "DIRECT", easyPay: "TOSSPAY" },
        }),
      );
  },
);

it("keeps unavailable benefits on checkout without applying a fake discount", () => {
  render(<RealCheckoutPage />);
  fireEvent.change(screen.getByRole("textbox", { name: "할인코드" }), {
    target: { value: "TEST" },
  });
  fireEvent.click(screen.getByRole("button", { name: "코드적용" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "할인 혜택은 현재 준비 중입니다.",
  );
  expect(screen.getByRole("combobox", { name: "쿠폰" })).toBeInTheDocument();
  expect(
    screen.getByText("사용 가능 적립금 :", { exact: false }),
  ).toHaveTextContent("0 원");
  expect(
    screen.getByText("사용 가능 쿠폰 :", { exact: false }),
  ).toHaveTextContent("0매");
  expect(
    screen.queryByRole("button", { name: "할인·무통장입금 시연하기" }),
  ).not.toBeInTheDocument();
  expect(state.create).not.toHaveBeenCalled();
  expect(state.prepare).not.toHaveBeenCalled();
  expect(state.request).not.toHaveBeenCalled();
});

it("identifies invalid recipient phone before calling payment APIs", () => {
  render(<RealCheckoutPage />);
  fireEvent.change(
    screen.getByRole("textbox", { name: "수령인 휴대전화 중간자리" }),
    { target: { value: "" } },
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "수령인 휴대전화 끝자리" }),
    { target: { value: "" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "토스페이 선택" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "약관에 동의합니다." }));
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "수령인 휴대전화 번호를 확인해 주세요.",
  );
  expect(state.create).not.toHaveBeenCalled();
  expect(state.prepare).not.toHaveBeenCalled();
});

it("opens Toss Pay with the server test key when customer phone contains hyphens", async () => {
  state.phone = "010-1234-5678";
  state.saveAddress.mockResolvedValueOnce({
    id: 3,
    recipientName: "주문자",
    phone: "01012345678",
    zipCode: "12345",
    address1: "주소",
    address2: "상세",
    isDefault: false,
  });
  state.prepare.mockResolvedValueOnce({
    orderId: 42,
    amount: 1000,
    tossClientKey: "test_ck_fixture",
  });
  render(<RealCheckoutPage />);
  fireEvent.click(screen.getByRole("checkbox", { name: "주문자 정보와 동일" }));
  expect(
    screen.getByRole("textbox", { name: "수령인 휴대전화 중간자리" }),
  ).toHaveValue("1234");
  fireEvent.click(screen.getByRole("button", { name: "토스페이 선택" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "약관에 동의합니다." }));
  fireEvent.click(screen.getByRole("button", { name: "결제하기" }));
  await waitFor(() => expect(state.request).toHaveBeenCalledTimes(1));
  expect(state.loadSdk).toHaveBeenCalledWith("test_ck_fixture");
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "CARD",
      card: { flowMode: "DIRECT", easyPay: "TOSSPAY" },
    }),
  );
});
