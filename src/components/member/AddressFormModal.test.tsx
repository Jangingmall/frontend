import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Address } from "@/types/member";

import { AddressFormModal } from "./AddressFormModal";

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

const EXISTING_ADDRESS: Address = {
  id: 1,
  recipientName: "김미담",
  phone: "01011112222",
  zipCode: "13529",
  address1: "경기도 성남시 분당구 판교역로 235",
  address2: "H스퀘어 N동 3층",
  isDefault: true,
};

describe("AddressFormModal", () => {
  it("add 모드: 빈 폼으로 시작하고 필수 항목을 채워야 제출된다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AddressFormModal
        open
        mode="add"
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText("받는 사람 이름을 입력해주세요."),
    ).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("홍길동"), "홍길동");
    await user.type(screen.getAllByPlaceholderText("0000")[0], "1234");
    await user.type(screen.getAllByPlaceholderText("0000")[1], "5678");
    await user.click(screen.getByRole("button", { name: "주소검색" }));
    await user.type(
      await screen.findByPlaceholderText("상세주소"),
      "101동 101호",
    );

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(onSubmit).toHaveBeenCalledWith({
      recipientName: "홍길동",
      phone: "01012345678",
      zipCode: "06035",
      address1: "서울특별시 강남구 학동로 343",
      address2: "101동 101호",
      isDefault: false,
    });
  });

  it("edit 모드: 기존 배송지 값으로 폼을 채운다", () => {
    render(
      <AddressFormModal
        open
        mode="edit"
        initialValue={EXISTING_ADDRESS}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("김미담")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1111")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2222")).toBeInTheDocument();
    expect(screen.getByDisplayValue("13529")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("경기도 성남시 분당구 판교역로 235"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument();
  });

  it("submitError가 있으면 폼 상단에 표시한다", () => {
    render(
      <AddressFormModal
        open
        mode="add"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        submitError="배송지를 저장하지 못했어요."
      />,
    );

    expect(screen.getByText("배송지를 저장하지 못했어요.")).toBeInTheDocument();
  });
});
