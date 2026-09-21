import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MyReviewPage } from "@/types/review";

import { MyReviewsList } from "./MyReviewsList";

const review: MyReviewPage["items"][number] = {
  id: 1,
  orderItemId: 9001,
  productId: 1001,
  productName: "백자 달항아리",
  thumbnailUrl: null,
  rating: 4.5,
  content: "정말 만족스러운 상품이었습니다.",
  images: [],
  createdAt: "2026-06-14T00:00:00.000Z",
};

const page: MyReviewPage = { items: [review], totalCount: 1 };

describe("MyReviewsList", () => {
  it("에러면 재시도 버튼과 함께 안내한다", () => {
    const onRetry = vi.fn();
    render(
      <MyReviewsList
        data={undefined}
        isPending={false}
        isFetching={false}
        hasError
        onRetry={onRetry}
        page={1}
        pageSize={5}
        onPageChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("데이터가 없으면 빈 상태 문구를 보여준다", () => {
    render(
      <MyReviewsList
        data={{ items: [], totalCount: 0 }}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        page={1}
        pageSize={5}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText("아직 작성한 후기가 없습니다."),
    ).toBeInTheDocument();
  });

  it("후기를 보여준다", () => {
    render(
      <MyReviewsList
        data={page}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        page={1}
        pageSize={5}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("백자 달항아리").length).toBeGreaterThan(0);
    expect(
      screen.getByText("정말 만족스러운 상품이었습니다."),
    ).toBeInTheDocument();
  });

  it("productName이 없으면(BE 미제공) 준비 중 문구를 보여준다", () => {
    render(
      <MyReviewsList
        data={{
          items: [{ ...review, productName: null }],
          totalCount: 1,
        }}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={vi.fn()}
        page={1}
        pageSize={5}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("상품 정보 준비 중").length).toBeGreaterThan(0);
  });
});
