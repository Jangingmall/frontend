import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HOME_PROMOTION_PRODUCTS } from "@/api/home/mock/fixtures";

import { PromotionSection } from "./PromotionSection";

describe("PromotionSection", () => {
  it("MSW 기획전 상품 4건의 이름·가격·장인·색상을 보여준다", () => {
    render(<PromotionSection items={HOME_PROMOTION_PRODUCTS} />);
    for (const product of HOME_PROMOTION_PRODUCTS) {
      const card = screen.getByText(product.name).closest("article");
      expect(card).not.toBeNull();
      const cardContent = within(card!);
      expect(cardContent.getByText(product.artisan.name!)).toBeInTheDocument();
      expect(
        cardContent.getByText(`${product.price.toLocaleString("ko-KR")}원`),
      ).toBeInTheDocument();
      if (product.rating !== null) {
        expect(
          cardContent.getByLabelText(`평점 ${product.rating.toFixed(1)}`),
        ).toBeInTheDocument();
      }
      for (const color of product.colors ?? [])
        expect(cardContent.getByTitle(color.hex)).toBeInTheDocument();
    }
    expect(HOME_PROMOTION_PRODUCTS).toHaveLength(4);
  });

  it("카드는 ProductCard를 그대로 쓰되 inert로 클릭·포커스를 막는다", () => {
    const { container } = render(
      <PromotionSection items={HOME_PROMOTION_PRODUCTS} />,
    );
    // jsdom은 `inert`의 접근성 트리 배제(hidden 취급)까지는 구현하지 않아 링크 자체는
    // 여전히 role="link"로 조회된다 — 실제 클릭·키보드 진입 차단은 `inert` 속성 자체가
    // 막는다(마우스만 막는 `pointer-events-none`과 달리 Tab·Enter도 막는다).
    // ProductCard의 상품명 링크는 `aria-hidden`이라 접근성 트리엔 이미지 링크만 잡힌다.
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(HOME_PROMOTION_PRODUCTS.length);
    for (const link of links) {
      expect(link.closest("[inert]")).not.toBeNull();
    }
    expect(container.querySelectorAll("[inert]")).toHaveLength(
      HOME_PROMOTION_PRODUCTS.length,
    );
  });

  it("전체보기는 실제 이동 없이 비활성 상태다", () => {
    render(<PromotionSection items={HOME_PROMOTION_PRODUCTS} />);
    expect(
      screen.queryByRole("link", { name: "전체보기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("전체보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
