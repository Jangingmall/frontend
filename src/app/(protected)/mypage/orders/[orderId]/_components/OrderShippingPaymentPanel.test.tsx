import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OrderPaymentSummary, OrderShippingAddress } from "@/types/order";

import { OrderShippingPaymentPanel } from "./OrderShippingPaymentPanel";

const address: OrderShippingAddress = {
  recipientName: "홍길동",
  phone: "01012345678",
  zipCode: "06236",
  address1: "서울특별시 강남구 테헤란로 123",
  address2: "미담빌딩 5층",
};

const payment: OrderPaymentSummary = {
  productAmount: 320000,
  shippingAmount: 3000,
  discountAmount: 1000,
  pointsUsed: 500,
  totalAmount: 321500,
  paymentMethod: "CARD",
};

describe("OrderShippingPaymentPanel", () => {
  it("배송지·결제 정보를 보여준다", () => {
    render(
      <OrderShippingPaymentPanel
        address={address}
        payment={payment}
        canChangeAddress={false}
        onChangeAddress={() => {}}
      />,
    );
    expect(screen.getByText("받는 분 :")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("휴대전화 :")).toBeInTheDocument();
    expect(screen.getByText("010-1234-5678")).toBeInTheDocument();
    expect(screen.getByText("총 321,500원")).toBeInTheDocument();
    expect(screen.getByText("신용·체크카드")).toBeInTheDocument();
  });

  it("canChangeAddress가 false면 배송지 변경 버튼을 숨긴다", () => {
    render(
      <OrderShippingPaymentPanel
        address={address}
        payment={payment}
        canChangeAddress={false}
        onChangeAddress={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "배송지 변경" }),
    ).not.toBeInTheDocument();
  });

  it("canChangeAddress가 true면 배송지 변경 버튼을 보여주고 클릭 시 콜백을 호출한다", () => {
    const onChangeAddress = vi.fn();
    render(
      <OrderShippingPaymentPanel
        address={address}
        payment={payment}
        canChangeAddress
        onChangeAddress={onChangeAddress}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "배송지 변경" }));
    expect(onChangeAddress).toHaveBeenCalledTimes(1);
  });

  it("결제 정보는 기본 펼침 상태고, 제목 클릭 시 접혔다 펴진다(Figma chevron-down 실측)", () => {
    render(
      <OrderShippingPaymentPanel
        address={address}
        payment={payment}
        canChangeAddress={false}
        onChangeAddress={() => {}}
      />,
    );
    const toggle = screen.getByRole("button", { name: "결제 정보" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("총 321,500원")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("총 321,500원")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("총 321,500원")).toBeInTheDocument();
  });

  it("결제 수단이 없으면 '-'를 보여준다(BE 미제공, be-requests.md #3)", () => {
    render(
      <OrderShippingPaymentPanel
        address={address}
        payment={{ ...payment, paymentMethod: null }}
        canChangeAddress={false}
        onChangeAddress={() => {}}
      />,
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
