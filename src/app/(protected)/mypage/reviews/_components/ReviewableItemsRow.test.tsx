import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ReviewableItem } from "@/types/review";

import { ReviewableItemsRow } from "./ReviewableItemsRow";

const item: ReviewableItem = {
  orderItemId: 9001,
  productId: 1001,
  productName: "백자 달항아리",
  thumbnailUrl: null,
  options: ["색상: 백자색"],
  purchasedAt: "2026-09-05T00:00:00.000Z",
  rewardPoints: 100,
};

describe("ReviewableItemsRow", () => {
  it("로딩 중이면 스켈레톤을 보여준다", () => {
    render(
      <ReviewableItemsRow
        data={undefined}
        isPending
        hasError={false}
        onRetry={vi.fn()}
        onWriteReview={vi.fn()}
      />,
    );
    expect(screen.queryByText(/후기를 기다리는/)).not.toBeInTheDocument();
  });

  it("에러면 재시도 버튼과 함께 안내한다", () => {
    const onRetry = vi.fn();
    render(
      <ReviewableItemsRow
        data={undefined}
        isPending={false}
        hasError
        onRetry={onRetry}
        onWriteReview={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("데이터가 없으면 빈 상태 문구를 보여준다", () => {
    render(
      <ReviewableItemsRow
        nickname="홍길동"
        data={[]}
        isPending={false}
        hasError={false}
        onRetry={vi.fn()}
        onWriteReview={vi.fn()}
      />,
    );
    expect(
      screen.getByText("홍길동 님의 후기를 기다리는 상품이 아직 없어요."),
    ).toBeInTheDocument();
  });

  it("카드를 보여주고 후기 작성하기를 누르면 onWriteReview를 호출한다", () => {
    const onWriteReview = vi.fn();
    render(
      <ReviewableItemsRow
        nickname="홍길동"
        data={[item]}
        isPending={false}
        hasError={false}
        onRetry={vi.fn()}
        onWriteReview={onWriteReview}
      />,
    );
    expect(
      screen.getByText("홍길동 님의 후기를 기다리는 상품이 1건 있어요"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "후기 작성하기" }));
    expect(onWriteReview).toHaveBeenCalledWith(item);
  });

  it("purchasedAt·rewardPoints가 없으면(BE 미제공) 해당 부분만 생략한다", () => {
    render(
      <ReviewableItemsRow
        nickname="홍길동"
        data={[{ ...item, purchasedAt: null, rewardPoints: null }]}
        isPending={false}
        hasError={false}
        onRetry={vi.fn()}
        onWriteReview={vi.fn()}
      />,
    );
    expect(screen.queryByText(/구매$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/적립금/)).not.toBeInTheDocument();
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "후기 작성하기" }),
    ).toBeInTheDocument();
  });
});
