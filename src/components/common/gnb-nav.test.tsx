import { render, screen } from "@testing-library/react";
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

describe("GnbNav", () => {
  it("5개 항목(전체 카테고리·장인관·신상품·베스트·기획전)을 렌더한다", () => {
    setUrl("/");
    render(<GnbNav />);

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
    render(<GnbNav />);

    for (const label of ["장인관", "기획전"]) {
      const item = screen.getByText(label);
      expect(item.tagName).toBe("SPAN");
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("/products에서는 전체 카테고리만 active다", () => {
    setUrl("/products");
    render(<GnbNav />);

    expect(screen.getByText("전체 카테고리")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("신상품")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("베스트")).not.toHaveAttribute("aria-current");
  });

  it("/products?preset=new에서는 신상품만 active다", () => {
    setUrl("/products", "preset=new");
    render(<GnbNav />);

    expect(screen.getByText("신상품")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("전체 카테고리")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("/products?category=x에서는 전체 카테고리/신상품/베스트 전부 active가 아니다", () => {
    setUrl("/products", "category=키친다이닝");
    render(<GnbNav />);

    expect(screen.getByText("전체 카테고리")).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText("신상품")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("베스트")).not.toHaveAttribute("aria-current");
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
