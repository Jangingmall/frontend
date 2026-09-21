import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mapProductSummary } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";
import type { Page } from "@/types/api";
import type { ProductSummary } from "@/types/product";

import { ProductCardGrid } from "./ProductCardGrid";

const product1 = mapProductSummary(productListPage1.items[0]);
const product2 = mapProductSummary(productListPage1.items[1]);

function page(items: ProductSummary[]): Page<ProductSummary> {
  return {
    items,
    page: 1,
    pageSize: 20,
    totalCount: items.length,
    totalPages: 1,
  };
}

const noop = () => {};

describe("ProductCardGrid", () => {
  it("로딩 중엔 스켈레톤을 보여준다", () => {
    render(
      <ProductCardGrid
        isPending
        isFetching={false}
        hasError={false}
        onRetry={noop}
        onPageChange={noop}
        emptyTitle="없음"
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("에러면 재시도 버튼과 함께 안내한다", () => {
    const onRetry = vi.fn();
    render(
      <ProductCardGrid
        isPending={false}
        isFetching={false}
        hasError
        onRetry={onRetry}
        onPageChange={noop}
        emptyTitle="없음"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("데이터가 비어 있으면 빈 상태 안내·액션을 보여준다", () => {
    render(
      <ProductCardGrid
        data={page([])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={noop}
        onPageChange={noop}
        emptyTitle="찜한 상품이 없어요"
        emptyAction={<button type="button">상품 보러 가기</button>}
      />,
    );
    expect(screen.getByText("찜한 상품이 없어요")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "상품 보러 가기" }),
    ).toBeInTheDocument();
  });

  it("카드 그리드와 페이지네이션을 렌더링한다", () => {
    render(
      <ProductCardGrid
        data={{ ...page([product1, product2]), page: 2, totalPages: 3 }}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={noop}
        onPageChange={noop}
        emptyTitle="없음"
      />,
    );
    expect(
      screen.getByRole("link", { name: product1.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: product2.name }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2 페이지" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("wishInteraction이 있으면 하트가 활성화되고 toggle을 전달한다", () => {
    const onToggle = vi.fn();
    render(
      <ProductCardGrid
        data={page([product1])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={noop}
        onPageChange={noop}
        emptyTitle="없음"
        wishInteraction={{ wishedIds: new Set([product1.id]), onToggle }}
      />,
    );
    const heartButton = screen.getByRole("button", {
      name: `${product1.name} 찜 취소`,
    });
    expect(heartButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(heartButton);
    expect(onToggle).toHaveBeenCalledWith(product1.id);
  });

  it("wishInteraction이 없으면 하트가 비활성 상태다", () => {
    render(
      <ProductCardGrid
        data={page([product1])}
        isPending={false}
        isFetching={false}
        hasError={false}
        onRetry={noop}
        onPageChange={noop}
        emptyTitle="없음"
      />,
    );
    expect(
      screen.getByRole("button", { name: `${product1.name} 찜하기` }),
    ).toBeDisabled();
  });
});
