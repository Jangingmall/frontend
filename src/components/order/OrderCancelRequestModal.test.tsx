import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderCancelRequestModal } from "./OrderCancelRequestModal";

const item = {
  productName: "백자 달항아리",
  price: 320000,
  quantity: 1,
  thumbnailUrl: null,
};

describe("OrderCancelRequestModal", () => {
  it("사유를 선택하지 않으면 제출되지 않는다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <OrderCancelRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));
    expect(
      await screen.findByText("취소 사유를 선택해주세요."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("사유를 고르고 등록하면 reason·photos가 담겨 제출된다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <OrderCancelRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "취소 사유" }));
    await user.click(await screen.findByRole("option", { name: "단순 변심" }));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      reason: "단순 변심",
      photos: [],
    });
  });

  it("직접 입력을 고르고 사유를 안 쓰면 제출되지 않는다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <OrderCancelRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "취소 사유" }));
    await user.click(await screen.findByRole("option", { name: "직접 입력" }));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(
      await screen.findByText("취소 사유를 작성해주세요."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("주문번호를 헤더에 보여준다", () => {
    render(
      <OrderCancelRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("주문번호 : JJ000000")).toBeInTheDocument();
  });
});
