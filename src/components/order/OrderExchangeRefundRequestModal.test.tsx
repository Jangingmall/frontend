import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderExchangeRefundRequestModal } from "./OrderExchangeRefundRequestModal";

const item = {
  productName: "백자 달항아리",
  price: 320000,
  quantity: 1,
  thumbnailUrl: null,
};

function photoFile(name: string): File {
  return new File([new Uint8Array(1024)], name, { type: "image/png" });
}

describe("OrderExchangeRefundRequestModal", () => {
  it("교환/환불을 고르지 않으면 제출되지 않는다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <OrderExchangeRefundRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        orderItemId={1}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));
    expect(
      await screen.findByText("교환 또는 환불을 선택해주세요."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("환불을 고르면 환불 전용 사유 옵션이 뜬다", async () => {
    const user = userEvent.setup();
    render(
      <OrderExchangeRefundRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        orderItemId={1}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "환불" }));
    await user.click(screen.getByRole("combobox", { name: "신청 사유" }));
    expect(
      await screen.findByRole("option", { name: "판매자 요청" }),
    ).toBeInTheDocument();
  });

  it("사진 없이 제출하면 에러를 보여준다(필수)", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <OrderExchangeRefundRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        orderItemId={1}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "교환" }));
    await user.click(screen.getByRole("combobox", { name: "신청 사유" }));
    await user.click(
      await screen.findByRole("option", { name: "상품 파손/불량" }),
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(
      await screen.findByText("사진을 1장 이상 첨부해주세요."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("전부 채우면 orderItemId를 포함해 제출된다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <OrderExchangeRefundRequestModal
        open
        onOpenChange={() => {}}
        item={item}
        orderItemId={42}
        purchasedAt="2026-09-05T00:00:00.000Z"
        orderNumber="JJ000000"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "교환" }));
    await user.click(screen.getByRole("combobox", { name: "신청 사유" }));
    await user.click(
      await screen.findByRole("option", { name: "상품 파손/불량" }),
    );

    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(fileInput, photoFile("photo.png"));

    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      orderItemId: 42,
      type: "EXCHANGE",
      reasonLabel: "상품 파손/불량",
      description: undefined,
      photos: [expect.any(File)],
    });
  });
});
