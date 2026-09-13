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

  it("카드는 ProductCard를 그대로 쓰되 inert로 클릭·포커스를 막는다", () => {
    const { container } = render(<PromotionSection />);
    // jsdom은 `inert`의 접근성 트리 배제(hidden 취급)까지는 구현하지 않아 링크 자체는
    // 여전히 role="link"로 조회된다 — 실제 클릭·키보드 진입 차단은 `inert` 속성 자체가
    // 막는다(마우스만 막는 `pointer-events-none`과 달리 Tab·Enter도 막는다).
    // ProductCard의 상품명 링크는 `aria-hidden`이라 접근성 트리엔 이미지 링크만 잡힌다.
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(PROMOTION_PRODUCTS.length);
    for (const link of links) {
      expect(link.closest("[inert]")).not.toBeNull();
    }
    expect(container.querySelectorAll("[inert]")).toHaveLength(
      PROMOTION_PRODUCTS.length,
    );
  });

  it("전체보기는 실제 이동 없이 비활성 상태다", () => {
    render(<PromotionSection />);
    expect(
      screen.queryByRole("link", { name: "전체보기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("전체보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
