import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GNB_CATEGORIES } from "@/constants/gnb-category";

import { CategoryMegaPanel } from "./category-mega-panel";

describe("CategoryMegaPanel", () => {
  it("대분류 7개 탭을 전부 렌더한다", () => {
    render(
      <CategoryMegaPanel
        categories={GNB_CATEGORIES}
        activeCategoryName="키친 · 다이닝"
        onActiveCategoryChange={vi.fn()}
      />,
    );

    for (const category of GNB_CATEGORIES) {
      expect(
        screen.getByRole("link", { name: category.name }),
      ).toBeInTheDocument();
    }
  });

  it("활성 탭의 소분류만 렌더한다", () => {
    render(
      <CategoryMegaPanel
        categories={GNB_CATEGORIES}
        activeCategoryName="홈 · 인테리어"
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "화병 · 꽃" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "다기 · 찻잔" }),
    ).not.toBeInTheDocument();
  });

  it('"전체상품" 링크는 대분류 코드로 상품 목록으로 간다', () => {
    render(
      <CategoryMegaPanel
        categories={GNB_CATEGORIES}
        activeCategoryName="키친 · 다이닝"
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "전체상품" })).toHaveAttribute(
      "href",
      "/products?category=키친-다이닝",
    );
  });

  it("소분류 링크는 소분류 코드로 상품 목록으로 간다", () => {
    render(
      <CategoryMegaPanel
        categories={GNB_CATEGORIES}
        activeCategoryName="키친 · 다이닝"
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "다기 · 찻잔" })).toHaveAttribute(
      "href",
      "/products?category=다기-찻잔",
    );
  });

  it("대분류 탭 자체도 대분류 코드로 상품 목록 링크를 갖는다", () => {
    render(
      <CategoryMegaPanel
        categories={GNB_CATEGORIES}
        activeCategoryName="키친 · 다이닝"
        onActiveCategoryChange={vi.fn()}
      />,
    );

    const tabLinks = screen.getAllByRole("link", { name: "키친 · 다이닝" });
    expect(
      tabLinks.some(
        (link) =>
          link.getAttribute("href") === "/products?category=키친-다이닝",
      ),
    ).toBe(true);
  });
});
