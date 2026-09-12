import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { GnbNav, isGnbNavItemActive } from "./gnb-nav";

const { usePathname, useSearchParams } = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname, useSearchParams }));

function setUrl(pathname: string, search = "") {
  usePathname.mockReturnValue(pathname);
  useSearchParams.mockReturnValue(new URLSearchParams(search));
}

/**
 * `GnbNav`는 이제 트리거 렌더 + 이벤트 위임만 한다 — 호버 디바운스·ESC·바깥 클릭·패널
 * 렌더는 `Gnb`가 갖는다(§`gnb.test.tsx`). 여기서는 콜백이 제대로 위임되는지만 본다.
 */
function renderGnbNav(
  overrides: Partial<{
    isCategoryPanelOpen: boolean;
    onCategoryTriggerMouseEnter: () => void;
    onCategoryTriggerFocus: () => void;
  }> = {},
) {
  return render(
    <GnbNav
      isCategoryPanelOpen={overrides.isCategoryPanelOpen ?? false}
      categoryTriggerRef={createRef()}
      onCategoryTriggerMouseEnter={
        overrides.onCategoryTriggerMouseEnter ?? vi.fn()
      }
      onCategoryTriggerFocus={overrides.onCategoryTriggerFocus ?? vi.fn()}
    />,
  );
}

describe("GnbNav", () => {
  it("전체 카테고리·장인관·신상품·베스트·기획전을 렌더한다", () => {
    setUrl("/");
    renderGnbNav();

    for (const label of [
      "전체 카테고리",
      "장인관",
      "신상품",
      "베스트",
      "기획전",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("장인관·기획전은 링크가 아니라 aria-disabled span이다", () => {
    setUrl("/");
    renderGnbNav();

    for (const label of ["장인관", "기획전"]) {
      const item = screen.getByText(label);
      expect(item.tagName).toBe("SPAN");
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("전체 카테고리는 여전히 /products로 가는 링크다", () => {
    setUrl("/");
    renderGnbNav();

    expect(screen.getByText("전체 카테고리").closest("a")).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("/products에서는 전체 카테고리만 active다", () => {
    setUrl("/products");
    renderGnbNav();

    expect(screen.getByText("전체 카테고리")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("신상품")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("베스트")).not.toHaveAttribute("aria-current");
  });

  it("/products?preset=new에서는 신상품만 active다", () => {
    setUrl("/products", "preset=new");
    renderGnbNav();

    expect(screen.getByText("신상품")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("전체 카테고리")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("/products?category=x에서는 전체 카테고리/신상품/베스트 전부 active가 아니다", () => {
    setUrl("/products", "category=키친다이닝");
    renderGnbNav();

    expect(screen.getByText("전체 카테고리")).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText("신상품")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("베스트")).not.toHaveAttribute("aria-current");
  });

  it("트리거에 마우스를 올리면 onCategoryTriggerMouseEnter를 부른다", () => {
    setUrl("/");
    const onCategoryTriggerMouseEnter = vi.fn();
    renderGnbNav({ onCategoryTriggerMouseEnter });

    fireEvent.mouseEnter(screen.getByText("전체 카테고리"));

    expect(onCategoryTriggerMouseEnter).toHaveBeenCalledOnce();
  });

  it("트리거에 포커스가 오면 onCategoryTriggerFocus를 부른다", () => {
    setUrl("/");
    const onCategoryTriggerFocus = vi.fn();
    renderGnbNav({ onCategoryTriggerFocus });

    fireEvent.focus(screen.getByText("전체 카테고리"));

    expect(onCategoryTriggerFocus).toHaveBeenCalledOnce();
  });

  it("isCategoryPanelOpen이면 트리거가 강조 배경을 갖는다", () => {
    setUrl("/");
    renderGnbNav({ isCategoryPanelOpen: true });

    expect(screen.getByText("전체 카테고리").closest("a")?.className).toMatch(
      /nav-jade/,
    );
  });
});

describe("isGnbNavItemActive", () => {
  it("pathname·preset이 둘 다 일치해야 true다", () => {
    expect(
      isGnbNavItemActive(
        "/products?preset=new",
        "/products",
        new URLSearchParams("preset=new"),
      ),
    ).toBe(true);
  });

  it("pathname이 다르면 false다", () => {
    expect(
      isGnbNavItemActive("/products", "/search", new URLSearchParams()),
    ).toBe(false);
  });

  it("preset 없는 항목은 현재 URL에 preset이 있으면 false다", () => {
    expect(
      isGnbNavItemActive(
        "/products",
        "/products",
        new URLSearchParams("preset=new"),
      ),
    ).toBe(false);
  });

  it("category만 다르면 false다", () => {
    expect(
      isGnbNavItemActive(
        "/products",
        "/products",
        new URLSearchParams("category=키친다이닝"),
      ),
    ).toBe(false);
  });
});
