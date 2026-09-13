import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mapProductListPage } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";

import { ProductCarouselSection } from "./ProductCarouselSection";

describe("ProductCarouselSection", () => {
  it("제목·설명·카드·전체보기 링크를 보여준다", () => {
    const data = mapProductListPage(productListPage1, { page: 1, size: 5 });
    render(
      <ProductCarouselSection
        title="베스트"
        description="최근 4주 판매·조회 기준"
        viewAllPreset="best"
        columns={5}
        data={data}
      />,
    );
    expect(screen.getByRole("heading", { name: "베스트" })).toBeInTheDocument();
    expect(screen.getByText("최근 4주 판매·조회 기준")).toBeInTheDocument();
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체보기" })).toHaveAttribute(
      "href",
      "/products?preset=best",
    );
  });

  it("데이터가 없으면 섹션을 렌더링하지 않는다", () => {
    const { container } = render(
      <ProductCarouselSection
        title="신상품"
        description="새롭게 만나는 장인과 작품의 이야기"
        viewAllPreset="new"
        columns={4}
        data={undefined}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("조회 결과가 빈 배열이어도 섹션을 렌더링하지 않는다", () => {
    const data = mapProductListPage(
      { items: [], totalCount: 0 },
      { page: 1, size: 4 },
    );
    const { container } = render(
      <ProductCarouselSection
        title="신상품"
        description="새롭게 만나는 장인과 작품의 이야기"
        viewAllPreset="new"
        columns={4}
        data={data}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
