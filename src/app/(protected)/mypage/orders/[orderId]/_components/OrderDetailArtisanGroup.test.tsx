import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OrderDetailArtisanGroup as OrderDetailArtisanGroupModel } from "@/types/order";

import { OrderDetailArtisanGroup } from "./OrderDetailArtisanGroup";

function group(
  overrides: Partial<OrderDetailArtisanGroupModel> = {},
): OrderDetailArtisanGroupModel {
  return {
    artisanName: "김도예",
    items: [
      {
        orderItemId: 1,
        productId: 1,
        productName: "백자 달항아리",
        price: 320000,
        quantity: 1,
        thumbnailUrl: null,
        options: [],
        status: "SHIPPING",
        artisanName: "김도예",
      },
    ],
    ...overrides,
  };
}

describe("OrderDetailArtisanGroup", () => {
  it("장인 이름·판매자 정보 버튼을 비활성으로 렌더한다(AD-1 범위 밖)", () => {
    render(
      <OrderDetailArtisanGroup
        group={group()}
        shippingAmount={3000}
        onAction={() => {}}
      />,
    );
    expect(screen.getByText("김도예")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "김도예 상세 준비 중" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "판매자 정보 준비 중" }),
    ).toBeDisabled();
  });

  it("artisanName이 없으면 준비 중 문구를 보여준다", () => {
    render(
      <OrderDetailArtisanGroup
        group={group({ artisanName: null })}
        shippingAmount={3000}
        onAction={() => {}}
      />,
    );
    expect(screen.getByText("제작자 정보 준비 중")).toBeInTheDocument();
  });

  it("그룹 내 아이템 수만큼 상품 카드를 렌더한다", () => {
    render(
      <OrderDetailArtisanGroup
        group={group({
          items: [
            {
              orderItemId: 1,
              productId: 1,
              productName: "A",
              price: 1000,
              quantity: 1,
              thumbnailUrl: null,
              options: [],
              status: "SHIPPING",
              artisanName: "김도예",
            },
            {
              orderItemId: 2,
              productId: 2,
              productName: "B",
              price: 2000,
              quantity: 1,
              thumbnailUrl: null,
              options: [],
              status: "SHIPPING",
              artisanName: "김도예",
            },
          ],
        })}
        shippingAmount={3000}
        onAction={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("아이템 액션 클릭 시 해당 아이템과 action을 함께 전달한다", () => {
    const onAction = vi.fn();
    const testGroup = group();
    render(
      <OrderDetailArtisanGroup
        group={testGroup}
        shippingAmount={3000}
        onAction={onAction}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "배송 조회" }));
    expect(onAction).toHaveBeenCalledWith(testGroup.items[0], "checkDelivery");
  });
});
