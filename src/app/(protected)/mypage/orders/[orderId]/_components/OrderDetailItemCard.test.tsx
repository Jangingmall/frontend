import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OrderDetailItem } from "@/types/order";

import { OrderDetailItemCard } from "./OrderDetailItemCard";

function item(overrides: Partial<OrderDetailItem> = {}): OrderDetailItem {
  return {
    orderItemId: 9001,
    productId: 1,
    productName: "백자 달항아리",
    price: 320000,
    quantity: 1,
    thumbnailUrl: null,
    options: ["색상: 백자색"],
    status: "SHIPPING",
    artisanName: "김도예",
    ...overrides,
  };
}

describe("OrderDetailItemCard", () => {
  it("상품 정보·옵션·배송비·상품 금액·주문일시를 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item()}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.getByText("- 색상: 백자색")).toBeInTheDocument();
    expect(screen.getByText("3,000원")).toBeInTheDocument();
    expect(screen.getByText("320,000원")).toBeInTheDocument();
    expect(screen.getByText(/상품 주문번호 9001/)).toBeInTheDocument();
    expect(screen.getByText(/주문일시 : 2026\.09\.01/)).toBeInTheDocument();
  });

  it("3개 이하 액션은 균등폭 한 줄로 렌더한다(배송 중)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "SHIPPING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "배송 조회" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의" }),
    ).toBeInTheDocument();
  });

  it("4개 액션이 되는 상태(배송 완료)는 첫 액션을 전체너비로 분리한다(design.md §2)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "DELIVERED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "구매 확정" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "후기 작성" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "교환 · 환불 신청" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의" }),
    ).toBeInTheDocument();
  });

  it("목록 매트릭스에 이미 1:1 문의가 있는 상태는 중복으로 추가하지 않는다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PAYMENT_PENDING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(screen.getAllByRole("button", { name: "1:1 문의" })).toHaveLength(1);
  });

  it("사유가 있으면 사유 텍스트를 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "CANCELED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        reason="장인이 주문 승인을 거절함"
      />,
    );
    expect(screen.getByText("주문 취소 사유 :")).toBeInTheDocument();
    expect(screen.getByText("장인이 주문 승인을 거절함")).toBeInTheDocument();
  });

  it("onAction이 없으면 액션 버튼이 비활성 상태다", () => {
    render(
      <OrderDetailItemCard
        item={item()}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(screen.getByRole("button", { name: "배송 조회" })).toBeDisabled();
  });

  it("onAction 클릭 시 올바른 action 타입을 전달한다", () => {
    const onAction = vi.fn();
    render(
      <OrderDetailItemCard
        item={item()}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "배송 조회" }));
    expect(onAction).toHaveBeenCalledWith("checkDelivery");
  });

  it("복사 버튼 클릭 시 클립보드에 아이템 주문번호를 복사한다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(
      <OrderDetailItemCard
        item={item()}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "복사" }));
    expect(writeText).toHaveBeenCalledWith("9001");
    expect(await screen.findByText("복사됨")).toBeInTheDocument();
  });
});
