import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mapProductSummary } from "@/api/products/mapper";
import { productListPage1 } from "@/api/products/mock/fixtures";

import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  it("가격, 장인, 상세 링크를 보여주고 찜은 별도 동작으로 전달한다", () => {
    const onWishlist = vi.fn();
    render(
      <ProductCard
        product={mapProductSummary(productListPage1.items[0])}
        onWishlist={onWishlist}
      />,
    );
    expect(screen.getByText("320,000원")).toBeInTheDocument();
    expect(screen.getByText("김도예")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "백자 달항아리" })).toHaveAttribute(
      "href",
      `/products/${encodeURIComponent("백자-달항아리")}-101`,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "백자 달항아리 찜하기" }),
    );
    expect(onWishlist).toHaveBeenCalledWith(101);
  });
  it("품절을 표시하고 후기 없는 상품에는 별점 0을 만들지 않는다", () => {
    render(
      <ProductCard
        product={{
          ...mapProductSummary(productListPage1.items[1]),
          isSoldOut: true,
        }}
      />,
    );
    expect(screen.getByText("품절")).toBeInTheDocument();
    expect(screen.queryByLabelText(/평점/)).not.toBeInTheDocument();
  });
});
