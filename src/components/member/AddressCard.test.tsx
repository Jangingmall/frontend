import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

describe("AddressCard", () => {
  it("배송지 정보를 표시한다", () => {
    render(
      <AddressCard
        address={ADDRESS}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );
    expect(screen.getByText("김미담")).toBeInTheDocument();
    expect(screen.getByText("01011112222")).toBeInTheDocument();
    expect(
      screen.getByText("서울특별시 강남구 학동로 343"),
    ).toBeInTheDocument();
    expect(screen.getByText("더 피나클 강남 15층")).toBeInTheDocument();
  });

  it("기본 배송지면 배지를 보여주고 '기본 배송지로 설정' 버튼은 숨긴다", () => {
    render(
      <AddressCard
        address={{ ...ADDRESS, isDefault: true }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );
    expect(screen.getByText("기본 배송지")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "기본 배송지로 설정" }),
    ).not.toBeInTheDocument();
  });

  it("기본 배송지가 아니면 '기본 배송지로 설정' 버튼을 보여준다", () => {
    render(
      <AddressCard
        address={ADDRESS}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDefault={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "기본 배송지로 설정" }),
    ).toBeInTheDocument();
  });

  it("수정·삭제·기본 설정 버튼 클릭 시 각각의 콜백에 address를 담아 호출한다", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onSetDefault = vi.fn();
    render(
      <AddressCard
        address={ADDRESS}
        onEdit={onEdit}
        onDelete={onDelete}
        onSetDefault={onSetDefault}
      />,
    );

    await user.click(screen.getByRole("button", { name: "배송지 수정하기" }));
    expect(onEdit).toHaveBeenCalledWith(ADDRESS);

    await user.click(screen.getByRole("button", { name: "배송지 삭제하기" }));
    expect(onDelete).toHaveBeenCalledWith(ADDRESS);

    await user.click(
      screen.getByRole("button", { name: "기본 배송지로 설정" }),
    );
    expect(onSetDefault).toHaveBeenCalledWith(ADDRESS);
  });
});
