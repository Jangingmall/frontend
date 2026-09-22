import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CheckoutPage } from "./CheckoutPage";

describe("주문 결제", () => {
  it("이메일 단일 입력과 수정 가능한 전화 앞자리를 제공하고 주문자를 복사한다", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    expect(
      screen.getAllByRole("textbox", { name: "주문자 이메일" }),
    ).toHaveLength(1);
    await user.type(screen.getByLabelText("주문자 이름"), "홍길동");
    const prefix = screen.getByLabelText("주문자 휴대전화 앞자리");
    await user.click(prefix);
    await user.click(await screen.findByRole("option", { name: "011" }));
    await user.click(
      screen.getByRole("checkbox", { name: "주문자 정보와 동일" }),
    );
    expect(screen.getByLabelText("수령인 이름")).toHaveValue("홍길동");
    expect(screen.getByLabelText("수령인 휴대전화 앞자리")).toHaveValue("011");
    await user.click(
      screen.getByRole("checkbox", { name: "주문자 정보와 동일" }),
    );
    await user.clear(screen.getByLabelText("수령인 이름"));
    await user.type(screen.getByLabelText("수령인 이름"), "김미담");
    expect(screen.getByLabelText("주문자 이름")).toHaveValue("홍길동");
  });
  it("약관 미동의는 비활성이고 잘못된 입력에는 오류와 포커스를 제공한다", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    expect(screen.getByRole("button", { name: "결제하기" })).toBeDisabled();
    await user.click(
      screen.getByRole("checkbox", { name: "약관에 동의합니다." }),
    );
    await user.click(screen.getByRole("button", { name: "결제하기" }));
    await waitFor(() =>
      expect(screen.getByLabelText("주문자 이름")).toHaveFocus(),
    );
    expect(screen.getByText("주문자 이름을 입력해 주세요.")).toBeVisible();
    await user.type(screen.getByLabelText("주문자 이름"), "홍길동");
    await waitFor(() =>
      expect(
        screen.queryByText("주문자 이름을 입력해 주세요."),
      ).not.toBeInTheDocument(),
    );
  });
  it("직접 배송메모와 샘플 주소를 입력한다", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);
    await user.click(screen.getByRole("combobox", { name: "배송 메모" }));
    await user.click(await screen.findByRole("option", { name: "직접 입력" }));
    await user.type(
      screen.getByLabelText("배송메모 직접 입력"),
      "문 앞에 놓아주세요",
    );
    await user.click(screen.getByRole("button", { name: "주소검색" }));
    expect(screen.getByLabelText("우편번호")).toHaveValue("00000");
    expect(screen.getByLabelText("배송메모 직접 입력")).toHaveValue(
      "문 앞에 놓아주세요",
    );
  });
  it("실패 모달을 닫으면 입력과 결제수단이 유지된다", async () => {
    const user = userEvent.setup();
    render(
      <CheckoutPage
        initialFeedback="declined"
        initialValues={{ customerName: "홍길동" }}
        initialMethod="CARD"
      />,
    );
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(screen.getByLabelText("주문자 이름")).toHaveValue("홍길동");
    expect(screen.getByRole("radio", { name: "신용·체크카드" })).toBeChecked();
  });
  it("프로그램 제출에도 약관 누락을 안내한다", async () => {
    render(<CheckoutPage />);
    fireEvent.submit(screen.getByRole("form", { name: "주문 결제" }));
    expect(await screen.findByText("약관에 동의해 주세요.")).toBeVisible();
  });
});

const validValues = {
  customerName: "홍길동",
  email: "midam@example.com",
  customerPhoneMiddle: "1234",
  customerPhoneLast: "5678",
  recipientName: "김미담",
  recipientPhoneMiddle: "1234",
  recipientPhoneLast: "5678",
  postcode: "00000",
  address: "샘플 주소",
};
it("결제수단 누락을 안내하고 선택하면 경고를 제거한다", async () => {
  const user = userEvent.setup();
  render(<CheckoutPage initialValues={validValues} />);
  await user.click(
    screen.getByRole("checkbox", { name: "약관에 동의합니다." }),
  );
  await user.click(screen.getByRole("button", { name: "결제하기" }));
  expect(await screen.findByText("결제수단을 선택해 주세요.")).toBeVisible();
  await user.click(screen.getByRole("radio", { name: "신용·체크카드" }));
  expect(screen.getByRole("radio", { name: "신용·체크카드" })).toBeChecked();
  expect(
    screen.queryByText("결제수단을 선택해 주세요."),
  ).not.toBeInTheDocument();
});
it.each(["CARD", "BANK_TRANSFER"] as const)(
  "%s 목업 완료 계약을 전달한다",
  async (method) => {
    const user = userEvent.setup();
    const complete = vi.fn();
    render(
      <CheckoutPage
        initialValues={validValues}
        initialMethod={method}
        onComplete={complete}
      />,
    );
    await user.click(
      screen.getByRole("checkbox", { name: "약관에 동의합니다." }),
    );
    await user.click(screen.getByRole("button", { name: "결제하기" }));
    await waitFor(() =>
      expect(complete).toHaveBeenCalledWith(
        method === "CARD" ? "success" : "bank-pending",
      ),
    );
  },
);
it("결제 시 거절된 입력과 수단은 재시도 후에도 유지한다", async () => {
  const user = userEvent.setup();
  render(
    <CheckoutPage
      initialValues={validValues}
      initialMethod="CARD"
      outcome="declined"
    />,
  );
  await user.click(
    screen.getByRole("checkbox", { name: "약관에 동의합니다." }),
  );
  await user.click(screen.getByRole("button", { name: "결제하기" }));
  await user.click(await screen.findByRole("button", { name: "다시 시도" }));
  expect(screen.getByLabelText("주문자 이름")).toHaveValue("홍길동");
  expect(screen.getByRole("radio", { name: "신용·체크카드" })).toBeChecked();
});

it("동일 배송을 먼저 체크한 뒤 주문자를 입력하면 배송정보도 갱신한다", async () => {
  const user = userEvent.setup();
  render(<CheckoutPage />);
  await user.click(
    screen.getByRole("checkbox", { name: "주문자 정보와 동일" }),
  );
  await user.type(screen.getByLabelText("주문자 이름"), "홍길동");
  await user.type(screen.getByLabelText("주문자 휴대전화 중간자리"), "1234");
  await user.type(screen.getByLabelText("주문자 휴대전화 끝자리"), "5678");
  expect(screen.getByLabelText("수령인 이름")).toHaveValue("홍길동");
  expect(screen.getByLabelText("수령인 휴대전화 중간자리")).toHaveValue("1234");
  expect(screen.getByLabelText("수령인 휴대전화 끝자리")).toHaveValue("5678");
});
it("동일 배송 체크 후 주문자 수정은 동기화하고 해제 후 수령인 편집은 보존한다", async () => {
  const user = userEvent.setup();
  render(<CheckoutPage initialValues={validValues} />);
  await user.click(
    screen.getByRole("checkbox", { name: "주문자 정보와 동일" }),
  );
  await user.clear(screen.getByLabelText("주문자 이름"));
  await user.type(screen.getByLabelText("주문자 이름"), "이주문");
  const prefix = screen.getByLabelText("주문자 휴대전화 앞자리");
  await user.click(prefix);
  await user.click(await screen.findByRole("option", { name: "011" }));
  expect(screen.getByLabelText("수령인 이름")).toHaveValue("이주문");
  expect(screen.getByLabelText("수령인 휴대전화 앞자리")).toHaveValue("011");
  await user.click(
    screen.getByRole("checkbox", { name: "주문자 정보와 동일" }),
  );
  await user.clear(screen.getByLabelText("수령인 이름"));
  await user.type(screen.getByLabelText("수령인 이름"), "김수령");
  await user.type(screen.getByLabelText("주문자 이름"), "자");
  expect(screen.getByLabelText("수령인 이름")).toHaveValue("김수령");
});

it("입력 지우기는 폼 값을 비우며 동일 배송 읽기 전용 입력에는 노출하지 않는다", async () => {
  const user = userEvent.setup();
  render(<CheckoutPage initialValues={validValues} />);
  await user.click(
    screen.getByRole("checkbox", { name: "주문자 정보와 동일" }),
  );
  const customer = screen.getByLabelText("주문자 이름");
  const recipient = screen.getByLabelText("수령인 이름");
  expect(
    within(recipient.parentElement!).queryByRole("button", {
      name: "입력 지우기",
    }),
  ).not.toBeInTheDocument();
  await user.click(
    within(customer.parentElement!).getByRole("button", {
      name: "입력 지우기",
    }),
  );
  expect(customer).toHaveValue("");
  expect(recipient).toHaveValue("");
  expect(customer).toHaveFocus();
});
