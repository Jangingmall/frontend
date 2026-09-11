import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mapProductListPage } from "@/api/products/mapper";
import {
  productListEmpty,
  productListPage1,
} from "@/api/products/mock/fixtures";

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
  it("빈 결과에서 필터 초기화 동작을 전달한다", () => {
    const props = createProps();
    render(
      <ProductResults
        {...props}
        data={mapProductListPage(productListEmpty, { page: 1, size: 20 })}
      />,
    );
    expect(screen.getByText("조건에 맞는 상품이 없어요")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "페이지 이동" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "필터 초기화" }));
    expect(props.onReset).toHaveBeenCalledOnce();
  });

  it("결과의 페이지 번호를 누르면 선택한 페이지를 전달한다", () => {
    const props = createProps();
    const data = mapProductListPage(productListPage1, { page: 1, size: 2 });
    render(<ProductResults {...props} data={data} />);
    expect(screen.getByText("총 3개")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2 페이지" }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
    expect(props.onPageChange).toHaveBeenCalledOnce();
  });
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
