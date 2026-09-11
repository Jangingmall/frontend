import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductResults } from "./ProductResults";

function createProps() {
  return {
    isPending: false,
    isFetching: false,
    hasError: false,
    excludeSoldOut: false,
    onExcludeSoldOutChange: vi.fn(),
    onPageChange: vi.fn(),
    onRetry: vi.fn(),
    onReset: vi.fn(),
  };
}

describe("상품 조회 상태", () => {
  it("오류는 재시도할 수 있고 빈 목록 안내로 바뀌지 않는다", () => {
    const props = createProps();
    render(<ProductResults {...props} hasError />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "상품을 불러오지 못했어요",
    );
    expect(
      screen.queryByText("조건에 맞는 상품이 없어요"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });
  it("초기 로딩은 빈 결과와 구분한다", () => {
    render(<ProductResults {...createProps()} isPending isFetching />);
    expect(
      screen.getByRole("status", { name: "상품 불러오는 중" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("조건에 맞는 상품이 없어요"),
    ).not.toBeInTheDocument();
  });
});
