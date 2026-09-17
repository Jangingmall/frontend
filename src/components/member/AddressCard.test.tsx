import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RadioGroup } from "@/components/ui/radio-button";
import type { Address } from "@/types/member";

import { AddressCard } from "./AddressCard";

const ADDRESS: Address = {
  id: 1,
  recipientName: "김미담",
  phone: "01011112222",
  zipCode: "06035",
  address1: "서울특별시 강남구 학동로 343",
  address2: "더 피나클 강남 15층",
  isDefault: false,
};

function renderCard(
  address: Address,
  onEdit = vi.fn(),
  onDelete = vi.fn(),
  onValueChange = vi.fn(),
) {
  return render(
    <RadioGroup onValueChange={onValueChange}>
      <AddressCard address={address} onEdit={onEdit} onDelete={onDelete} />
    </RadioGroup>,
  );
}

describe("AddressCard", () => {
  it("배송지 정보를 표시한다", () => {
    renderCard(ADDRESS);
    expect(screen.getByText("김미담")).toBeInTheDocument();
    expect(screen.getByText("010-1111-2222")).toBeInTheDocument();
    expect(
      screen.getByText("서울특별시 강남구 학동로 343"),
    ).toBeInTheDocument();
    expect(screen.getByText("더 피나클 강남 15층")).toBeInTheDocument();
  });

  it("기본 배송지면 헤더에 '기본 주소지'를 보여준다", () => {
    renderCard({ ...ADDRESS, isDefault: true });
    expect(screen.getByText("기본 주소지")).toBeInTheDocument();
    expect(screen.queryByText("기본 주소지로 설정")).not.toBeInTheDocument();
  });

  it("기본 배송지가 아니면 헤더에 '기본 주소지로 설정'을 보여준다", () => {
    renderCard(ADDRESS);
    expect(screen.getByText("기본 주소지로 설정")).toBeInTheDocument();
  });

  it("수정·삭제 버튼 클릭 시 각각의 콜백에 address를 담아 호출한다", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderCard(ADDRESS, onEdit, onDelete);

    await user.click(screen.getByRole("button", { name: "주소지 수정하기" }));
    expect(onEdit).toHaveBeenCalledWith(ADDRESS);

    await user.click(screen.getByRole("button", { name: "주소지 삭제하기" }));
    expect(onDelete).toHaveBeenCalledWith(ADDRESS);
  });

  it("헤더를 클릭하면 감싸는 RadioGroup에 address.id를 전달한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCard(ADDRESS, vi.fn(), vi.fn(), onValueChange);

    await user.click(screen.getByText("기본 주소지로 설정"));
    expect(onValueChange).toHaveBeenCalledWith(ADDRESS.id, expect.anything());
  });
});
