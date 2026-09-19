import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ImageRef } from "@/types/image";

import { OrderProductCard } from "./OrderProductCard";

const thumbnail: ImageRef = {
  imageId: "image_01HXYZ",
  variants: [{ width: 320, url: "/320.webp", format: "webp" }],
};

describe("OrderProductCard", () => {
  it("입금확인중 상태의 액션 버튼을 렌더한다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="PAYMENT_PENDING"
      />,
    );
    expect(
      screen.getByRole("button", { name: "입금 정보 확인" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "주문 취소" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의" }),
    ).toBeInTheDocument();
  });

  it("배송완료 상태는 후기 작성 버튼에 적립금 배지를 함께 보여준다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="DELIVERED"
      />,
    );
    expect(
      screen.getByRole("button", { name: "후기 작성" }),
    ).toBeInTheDocument();
    expect(screen.getByText("적립금 + 100원")).toBeInTheDocument();
  });

  it("구매확정 상태의 액션 버튼을 렌더한다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="PURCHASE_CONFIRMED"
      />,
    );
    expect(
      screen.getByRole("button", { name: "장바구니 담기" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "바로 구매하기" }),
    ).toBeInTheDocument();
  });

  it("환불완료 상태의 액션 버튼을 렌더한다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="REFUND_COMPLETED"
      />,
    );
    expect(
      screen.getByRole("button", { name: "환불 정보" }),
    ).toBeInTheDocument();
  });

  it("주문취소 상태는 reason이 없으면 장바구니 담기·바로 구매하기를 보여준다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="CANCELED"
      />,
    );
    expect(
      screen.getByRole("button", { name: "장바구니 담기" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "1:1 문의" }),
    ).not.toBeInTheDocument();
  });

  it("주문취소 상태는 reason이 있으면 사유 텍스트와 1:1 문의만 보여준다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="CANCELED"
        reason="주문 승인 거절 ( 작업 불가 )"
      />,
    );
    expect(screen.getByText("주문 취소 사유 :")).toBeInTheDocument();
    expect(
      screen.getByText("주문 승인 거절 ( 작업 불가 )"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1:1 문의" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "장바구니 담기" }),
    ).not.toBeInTheDocument();
  });

  it("showStatusBadge가 true면 카드 자체 상태 배지를 보여준다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="SHIPPING"
        showStatusBadge
      />,
    );
    expect(screen.getByText("배송 중")).toBeInTheDocument();
  });

  it("showStatusBadge 기본값은 false라 상태 배지를 그리지 않는다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="SHIPPING"
      />,
    );
    expect(screen.queryByText("배송 중")).not.toBeInTheDocument();
  });

  it("더보기 버튼은 비활성 상태로 aria-label과 함께 렌더된다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="SHIPPING"
      />,
    );
    const moreButton = screen.getByRole("button", { name: "기타" });
    expect(moreButton).toBeDisabled();
  });

  it("compact variant는 액션 없이 이름·가격·상세보기만 표시한다", () => {
    render(
      <OrderProductCard
        variant="compact"
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
      />,
    );
    expect(screen.getByText("상품명")).toBeInTheDocument();
    expect(screen.getByText("10,000원")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /주문 상세보기/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "기타" }),
    ).not.toBeInTheDocument();
  });

  it("onAction이 없으면 액션 버튼이 비활성 상태로 렌더된다", () => {
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="SHIPPING"
      />,
    );
    expect(screen.getByRole("button", { name: "배송 조회" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "1:1 문의" })).toBeDisabled();
  });

  it("onAction 클릭 시 올바른 action 타입을 전달한다", () => {
    const onAction = vi.fn();
    render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="SHIPPING"
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "배송 조회" }));
    expect(onAction).toHaveBeenCalledWith("checkDelivery");
  });

  it("이미지 로드 실패 시 placeholder로 대체한다", () => {
    const { container } = render(
      <OrderProductCard
        thumbnail={thumbnail}
        productName="상품명"
        price={10000}
        status="SHIPPING"
      />,
    );
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/images/product-placeholder.png");
  });

  it("thumbnail이 URL 문자열이면 그대로 렌더한다(주문 목록 API 계약)", () => {
    const { container } = render(
      <OrderProductCard
        thumbnail="https://cdn.midam.store/products/abc.jpg"
        productName="상품명"
        price={10000}
        status="SHIPPING"
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://cdn.midam.store/products/abc.jpg",
    );
  });

  it("thumbnail이 null이면 placeholder를 보여준다", () => {
    const { container } = render(
      <OrderProductCard
        thumbnail={null}
        productName="상품명"
        price={10000}
        status="SHIPPING"
      />,
    );
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "/images/product-placeholder.png",
    );
  });
});
