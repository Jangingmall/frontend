import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mapProductSummary } from "@/api/products/mapper";
import { productCatalogue } from "@/api/products/mock/catalogue";

import { ProductOrder } from "./ProductOrder";

const thumbnail = mapProductSummary(productCatalogue[0]).thumbnail;

describe("ProductOrder", () => {
  it("상품명·옵션·수량/가격을 표시한다", () => {
    render(
      <ProductOrder
        thumbnail={thumbnail}
        productName="백자 달항아리"
        options={["색상: 백자토", "사이즈: 중"]}
        quantity={2}
        price={320000}
      />,
    );
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
    expect(screen.getByText("− 색상: 백자토")).toBeInTheDocument();
    expect(screen.getByText("− 사이즈: 중")).toBeInTheDocument();
    expect(screen.getByText("2개 / 320,000원")).toBeInTheDocument();
  });

  it("옵션이 없으면 옵션 영역을 표시하지 않는다", () => {
    render(
      <ProductOrder
        thumbnail={thumbnail}
        productName="백자 달항아리"
        quantity={1}
        price={320000}
      />,
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("주문 유의사항이 없으면 안내 영역을 표시하지 않는다", () => {
    render(
      <ProductOrder
        thumbnail={thumbnail}
        productName="백자 달항아리"
        quantity={1}
        price={320000}
      />,
    );
    expect(screen.queryByText("주문 유의사항")).not.toBeInTheDocument();
  });

  it("주문 유의사항이 있으면 라벨과 함께 표시한다", () => {
    render(
      <ProductOrder
        thumbnail={thumbnail}
        productName="백자 달항아리"
        quantity={1}
        price={320000}
        note="주문제작 작품 포함 · 약 6주 후 전체 작품이 함께 배송됩니다."
      />,
    );
    expect(screen.getByText("주문 유의사항")).toBeInTheDocument();
    expect(
      screen.getByText(
        "주문제작 작품 포함 · 약 6주 후 전체 작품이 함께 배송됩니다.",
      ),
    ).toBeInTheDocument();
  });
});
