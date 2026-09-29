import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { gnbCategoriesFixture } from "@/api/products/mock/gnb-categories";

import { CategoryMegaPanel } from "./category-mega-panel";

const [kitchen, home] = gnbCategoriesFixture;

describe("CategoryMegaPanel", () => {
  it("대분류 7개 탭을 전부 렌더한다", () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    for (const category of gnbCategoriesFixture) {
      expect(
        screen.getByRole("link", { name: category.name }),
      ).toBeInTheDocument();
    }
  });

  it("활성 탭의 소분류만 렌더한다", () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={home.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "화병 · 꽃" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "다기 · 찻잔" }),
    ).not.toBeInTheDocument();
  });

  it('"전체상품" 링크는 대분류 ID로 상품 목록으로 간다', () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "전체상품" })).toHaveAttribute(
      "href",
      "/products?category=category-1",
    );
  });

  it("소분류 링크는 소분류 ID로 상품 목록으로 간다", () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "다기 · 찻잔" })).toHaveAttribute(
      "href",
      "/products?category=subcategory-1",
    );
  });

  it("대분류 탭 자체도 대분류 ID로 상품 목록 링크를 갖는다", () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    const tabLinks = screen.getAllByRole("link", { name: "키친 · 다이닝" });
    expect(
      tabLinks.some(
        (link) => link.getAttribute("href") === "/products?category=category-1",
      ),
    ).toBe(true);
  });

  it("탭에 hover하면 그 탭의 ID로 활성 변경을 알린다", async () => {
    const onActiveCategoryChange = vi.fn();
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={onActiveCategoryChange}
      />,
    );

    await userEvent.hover(screen.getByRole("link", { name: home.name }));
    expect(onActiveCategoryChange).toHaveBeenCalledWith("category-2");
  });

  it("분류가 아직 없으면 로딩 상태를 보여준다", () => {
    render(
      <CategoryMegaPanel
        categories={[]}
        status="loading"
        activeCategoryId=""
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("status", { name: "분류를 불러오는 중" }),
    ).toBeInTheDocument();
  });

  it("분류가 없고 오류면 안내와 다시 시도 버튼을 보여주고 재시도를 알린다", async () => {
    const onRetry = vi.fn();
    render(
      <CategoryMegaPanel
        categories={[]}
        status="error"
        onRetry={onRetry}
        activeCategoryId=""
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "분류를 불러오지 못했습니다",
    );
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("이미 받은 분류가 있으면 오류 상태여도 분류를 유지한다", () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        status="error"
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "다기 · 찻잔" }),
    ).toBeInTheDocument();
  });

  it("프로토타입 명세: 대분류 바는 800ms ease-in으로 위에서 내려오고, 소분류는 800ms dissolve, 항목 hover는 600ms ease-in이다", () => {
    render(
      <CategoryMegaPanel
        categories={gnbCategoriesFixture}
        activeCategoryId={kitchen.id}
        onActiveCategoryChange={vi.fn()}
      />,
    );

    const panel = document.querySelector('[data-slot="category-mega-panel"]');
    expect(panel).toHaveClass(
      "animate-in",
      "slide-in-from-top-full",
      "duration-800",
      "ease-in",
      "motion-reduce:animate-none",
    );
    const subPanel =
      screen.getByLabelText("키친 · 다이닝 소분류").parentElement;
    expect(subPanel).toHaveClass("animate-in", "fade-in", "duration-800");
    expect(screen.getByRole("link", { name: "다기 · 찻잔" })).toHaveClass(
      "transition-colors",
      "duration-600",
      "ease-in",
    );
  });
});
