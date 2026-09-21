import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReviewFormModal } from "./ReviewFormModal";

const item = {
  productName: "백자 달항아리",
  thumbnailUrl: null,
  options: ["색상: 백자색"],
};

describe("ReviewFormModal", () => {
  it("별점을 고르지 않으면 제출되지 않는다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <ReviewFormModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        onSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));
    expect(await screen.findByText("별점을 입력해주세요.")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("별점을 고르고 본문을 비운 채 제출하면 등록되지 않는다(BE `@NotBlank` 계약)", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <ReviewFormModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        onSubmit={handleSubmit}
      />,
    );
    fireEvent.click(screen.getByTestId("review-rating-star-4"));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(
      await screen.findByText("후기 내용을 입력해주세요."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("별점을 고르고 본문을 작성해 등록하면 rating·content·photos가 담겨 제출된다", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(
      <ReviewFormModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        onSubmit={handleSubmit}
      />,
    );
    fireEvent.click(screen.getByTestId("review-rating-star-4"));
    await user.type(
      screen.getByRole("textbox", { name: "후기 본문" }),
      "정말 만족스러운 상품이었습니다.",
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      rating: 5,
      content: "정말 만족스러운 상품이었습니다.",
      photos: [],
    });
  });

  it("상품 요약 정보를 보여준다", () => {
    render(
      <ReviewFormModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.getByText("색상: 백자색")).toBeInTheDocument();
  });

  it("submitError가 있으면 폼 상단에 보여준다", () => {
    render(
      <ReviewFormModal
        open
        onOpenChange={() => {}}
        item={item}
        purchasedAt="2026-09-05T00:00:00.000Z"
        submitError="후기 등록에 실패했습니다."
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("후기 등록에 실패했습니다.")).toBeInTheDocument();
  });
});
