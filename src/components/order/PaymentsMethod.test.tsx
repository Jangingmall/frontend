import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PaymentsMethod } from "./PaymentsMethod";

describe("PaymentsMethod", () => {
  it("4개 결제수단 옵션을 렌더한다", () => {
    render(<PaymentsMethod />);
    expect(screen.getByText("실시간 계좌이체")).toBeInTheDocument();
    expect(screen.getByText("무통장입금")).toBeInTheDocument();
    expect(screen.getByText("신용·체크카드")).toBeInTheDocument();
    expect(screen.getByText("토스페이")).toBeInTheDocument();
  });

  it("BANK_TRANSFER 선택 시에만 안내 박스를 보여준다", () => {
    const { rerender } = render(<PaymentsMethod value="CARD" />);
    expect(
      screen.queryByText(/주문 완료 후 24시간 이내/),
    ).not.toBeInTheDocument();

    rerender(<PaymentsMethod value="BANK_TRANSFER" />);
    expect(screen.getByText(/주문 완료 후 24시간 이내/)).toBeInTheDocument();
    expect(screen.getByText(/OO은행 000-0000-0000/)).toBeInTheDocument();
  });

  it("계좌 정보를 전달하면 안내 박스에 반영된다", () => {
    render(
      <PaymentsMethod
        value="BANK_TRANSFER"
        bankAccountInfo={{
          bankName: "신한은행",
          accountNumber: "110-000-000000",
          accountHolder: "홍길동",
        }}
      />,
    );
    expect(
      screen.getByText(/신한은행 110-000-000000 \(예금주: 홍길동\)/),
    ).toBeInTheDocument();
  });

  it("옵션 선택 시 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PaymentsMethod onChange={onChange} />);
    await user.click(screen.getByText("토스페이"));
    expect(onChange).toHaveBeenCalledWith("TOSS_PAY");
  });
});
