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

  it("배송 중은 배송 조회(대표, solid)와 1:1 문의하기(outline)를 보여준다", () => {
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
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
  });

  it("상품 준비 중은 대표 액션 없이 1:1 문의하기만 보여준다(Figma 1718:16488)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PREPARING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "배송지 변경" }),
    ).not.toBeInTheDocument();
  });

  it("배송 완료는 구매 확정(대표) → 교환·환불 신청 → 후기 작성 → 1:1 문의하기 순으로 보여준다", () => {
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
      screen.getByRole("button", { name: "교환 · 환불 신청" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "후기 작성" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
  });

  it("구매 확정은 후기 작성(대표) → 장바구니에 넣기 → 바로 구매하기 → 1:1 문의하기 순으로 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PURCHASE_CONFIRMED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "후기 작성" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "장바구니에 넣기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "바로 구매하기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
  });

  it("교환 신청은 교환 신청 취소·배송 조회·1:1 문의하기를 보여준다(대표 없음)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "EXCHANGE_REQUESTED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        reason="제품 파손"
      />,
    );
    expect(
      screen.getByRole("button", { name: "교환 신청 취소" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "배송 조회" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
    expect(screen.getByText("교환 사유:")).toBeInTheDocument();
    expect(screen.getByText("(승인 대기 중)")).toBeInTheDocument();
  });

  it("교환 승인은 상품 회수 안내(대표) → 교환 신청 취소 → 배송 조회 → 1:1 문의하기를 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "EXCHANGE_APPROVED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "상품 회수 안내" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "교환 신청 취소" }),
    ).toBeInTheDocument();
  });

  it("환불 신청은 환불 신청 취소·배송 조회·1:1 문의하기를 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "REFUND_REQUESTED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        reason="제품 파손"
      />,
    );
    expect(
      screen.getByRole("button", { name: "환불 신청 취소" }),
    ).toBeInTheDocument();
    expect(screen.getByText("환불 사유:")).toBeInTheDocument();
    expect(screen.getByText("(승인 대기 중)")).toBeInTheDocument();
  });

  it("환불 승인은 상품 회수 안내(대표) → 환불 신청 취소 → 배송 조회 → 1:1 문의하기를 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "REFUND_APPROVED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "상품 회수 안내" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "환불 신청 취소" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["EXCHANGE_REJECTED", "교환 불가"],
    ["REFUND_REJECTED", "환불 불가"],
  ] as const)(
    "%s는 대표 액션 없이 1:1 문의하기만 보여준다",
    (status, label) => {
      render(
        <OrderDetailItemCard
          item={item({ status })}
          shippingAmount={3000}
          orderedAt="2026-09-01T00:00:00.000Z"
          reason="상품 사용에 따른 파손"
        />,
      );
      expect(
        screen.getByRole("button", { name: "1:1 문의하기" }),
      ).toBeInTheDocument();
      expect(screen.getByText(`${label} 사유 :`)).toBeInTheDocument();
    },
  );

  it("목록 매트릭스에 이미 1:1 문의가 있는 상태는 중복으로 추가하지 않는다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PAYMENT_PENDING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getAllByRole("button", { name: "1:1 문의하기" }),
    ).toHaveLength(1);
  });

  it("입금확인중 + 실시간 계좌이체면 입금 정보 확인 버튼을 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PAYMENT_PENDING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        paymentMethod="REALTIME_TRANSFER"
      />,
    );
    expect(
      screen.getByRole("button", { name: "입금 정보 확인" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "주문 취소하기" }),
    ).toBeInTheDocument();
  });

  it("입금확인중 + 카드 결제면 입금 정보 확인 버튼을 숨긴다(Figma 스펙시트 2080:112091)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PAYMENT_PENDING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        paymentMethod="CARD"
      />,
    );
    expect(
      screen.queryByRole("button", { name: "입금 정보 확인" }),
    ).not.toBeInTheDocument();
  });

  it("입금확인중은 대표(주문취소하기) 뒤에 장바구니에 넣기·바로 구매하기도 보여준다(Figma 1718:16488)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PAYMENT_PENDING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        paymentMethod="CARD"
      />,
    );
    expect(
      screen.getByRole("button", { name: "장바구니에 넣기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "바로 구매하기" }),
    ).toBeInTheDocument();
  });

  it("주문 유의사항은 상태마다 다른 문구를 보여준다(Figma 1718:16488)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "PAYMENT_PENDING" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByText(/입금 확인은 평일 기준 NN시간 이내 처리됩니다/),
    ).toBeInTheDocument();
  });

  it("사유 배너를 보여주는 상태는 주문 유의사항 박스를 생략한다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "CANCELED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        reason="장인이 주문 승인을 거절함"
      />,
    );
    expect(screen.queryByText("주문 유의사항")).not.toBeInTheDocument();
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
    expect(screen.getByText("주문 취소 사유:")).toBeInTheDocument();
    expect(screen.getByText("장인이 주문 승인을 거절함")).toBeInTheDocument();
  });

  it("소비자 취소(사유 없음)는 대표 없이 장바구니에 넣기·바로 구매하기·1:1 문의하기를 보여준다(Figma 1725:43684)", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "CANCELED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "장바구니에 넣기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "바로 구매하기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
  });

  it("주문 취소는 사유가 있어도 소비자(단순 변심)면 장바구니에 넣기 등을 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "CANCELED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        reason="단순 변심"
        cancelInitiator="consumer"
      />,
    );
    expect(screen.getByText("주문 취소 사유:")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "장바구니에 넣기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "바로 구매하기" }),
    ).toBeInTheDocument();
  });

  it("주문 취소는 사유가 없어도 장인 거절이면 1:1 문의만 보여준다", () => {
    render(
      <OrderDetailItemCard
        item={item({ status: "CANCELED" })}
        shippingAmount={3000}
        orderedAt="2026-09-01T00:00:00.000Z"
        cancelInitiator="artisan"
      />,
    );
    expect(
      screen.queryByRole("button", { name: "장바구니에 넣기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의하기" }),
    ).toBeInTheDocument();
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
