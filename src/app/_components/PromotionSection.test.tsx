import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PROMOTION_PRODUCTS } from "@/app/_lib/promotion-fixtures";

import { PromotionSection } from "./PromotionSection";

describe("PromotionSection", () => {
  it("더미 상품 4건을 이름·가격으로 보여준다", () => {
    render(<PromotionSection />);
    for (const product of PROMOTION_PRODUCTS) {
      expect(screen.getByText(product.name)).toBeInTheDocument();
      expect(
        screen.getByText(`${product.price.toLocaleString("ko-KR")}원`),
      ).toBeInTheDocument();
    }
  });

  it("카드·전체보기 모두 클릭 가능한 링크가 없다", () => {
    render(<PromotionSection />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("전체보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
