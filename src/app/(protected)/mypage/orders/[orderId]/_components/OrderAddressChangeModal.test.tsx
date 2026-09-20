import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { OrderShippingAddress } from "@/types/order";

import { OrderAddressChangeModal } from "./OrderAddressChangeModal";

const mockOpenPostcode = vi.fn(
  async (options?: { onComplete?: (data: unknown) => void }) => {
    options?.onComplete?.({
      zonecode: "06035",
      roadAddress: "서울특별시 강남구 학동로 343",
    });
  },
);

vi.mock("react-daum-postcode", () => ({
  useKakaoPostcodePopup: () => mockOpenPostcode,
}));

const EXISTING_ADDRESS: OrderShippingAddress = {
  recipientName: "김미담",
  phone: "01011112222",
  zipCode: "13529",
  address1: "경기도 성남시 분당구 판교역로 235",
  address2: "H스퀘어 N동 3층",
};

describe("OrderAddressChangeModal", () => {
  it("기존 배송지 값으로 폼을 채운다(기본 배송지 체크박스는 없음)", () => {
    render(
      <OrderAddressChangeModal
        open
        initialValue={EXISTING_ADDRESS}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("김미담")).toBeInTheDocument();
    expect(screen.getByDisplayValue("13529")).toBeInTheDocument();
    expect(screen.queryByText("기본 배송지로 설정")).not.toBeInTheDocument();
  });

  it("필수 항목을 채워야 제출되고, 변경된 값으로 onSubmit을 호출한다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <OrderAddressChangeModal
        open
        initialValue={EXISTING_ADDRESS}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "주소검색" }));
    await user.click(screen.getByRole("button", { name: "변경" }));

    expect(onSubmit).toHaveBeenCalledWith({
      recipientName: "김미담",
      phone: "01011112222",
      zipCode: "06035",
      address1: "서울특별시 강남구 학동로 343",
      address2: "H스퀘어 N동 3층",
    });
  });

  it("submitError가 있으면 폼 상단에 표시한다", () => {
    render(
      <OrderAddressChangeModal
        open
        initialValue={EXISTING_ADDRESS}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        submitError="배송지를 변경하지 못했어요."
      />,
    );
    expect(screen.getByText("배송지를 변경하지 못했어요.")).toBeInTheDocument();
  });
});
