import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  OrderClaimReasonField,
  type OrderClaimReasonValue,
} from "./OrderClaimReasonField";

const OPTIONS = ["단순 변심", "중복 주문", "직접 입력"] as const;

function Wrapper({
  onChange,
}: {
  onChange?: (value: OrderClaimReasonValue) => void;
}) {
  const [value, setValue] = useState<OrderClaimReasonValue>({ label: "" });
  return (
    <OrderClaimReasonField
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      ariaLabel="취소 사유"
      freeTextPlaceholder="취소 사유를 작성해주세요."
    />
  );
}

describe("OrderClaimReasonField", () => {
  it("직접 입력이 아니면 textarea를 보여주지 않는다", async () => {
    const user = userEvent.setup();
    render(<Wrapper />);
    await user.click(screen.getByRole("combobox", { name: "취소 사유" }));
    await user.click(await screen.findByRole("option", { name: "단순 변심" }));
    expect(
      screen.queryByPlaceholderText("취소 사유를 작성해주세요."),
    ).not.toBeInTheDocument();
  });

  it("직접 입력을 고르면 textarea가 나타나고 입력값이 freeText로 전달된다", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Wrapper onChange={handleChange} />);
    await user.click(screen.getByRole("combobox", { name: "취소 사유" }));
    await user.click(await screen.findByRole("option", { name: "직접 입력" }));

    const textarea = screen.getByPlaceholderText("취소 사유를 작성해주세요.");
    await user.type(textarea, "포장이 파손됐어요");

    expect(handleChange).toHaveBeenLastCalledWith({
      label: "직접 입력",
      freeText: "포장이 파손됐어요",
    });
  });
});
