import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
 * `GnbNav`는 이제 controlled라(§3.3) 실제 훅처럼 동작하는 상태가 필요한 인터랙션 테스트는
 * 이 래퍼로 감싼다. 단순 렌더·active 판정 테스트는 고정 props로 직접 `<GnbNav />`를 쓴다.
 */
function ControlledGnbNav() {
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  return (
    <GnbNav
      isCategoryPanelOpen={isCategoryPanelOpen}
      onCategoryPanelOpenChange={setIsCategoryPanelOpen}
    />
  );
}

describe("GnbNav", () => {
  it("전체 카테고리·장인관·신상품·베스트·기획전을 렌더한다", () => {
    setUrl("/");
    render(
      <GnbNav
        isCategoryPanelOpen={false}
        onCategoryPanelOpenChange={vi.fn()}
      />,
    );

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
    render(
      <GnbNav
        isCategoryPanelOpen={false}
        onCategoryPanelOpenChange={vi.fn()}
      />,
    );

    for (const label of ["장인관", "기획전"]) {
      const item = screen.getByText(label);
      expect(item.tagName).toBe("SPAN");
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("전체 카테고리는 여전히 /products로 가는 링크다", () => {
    setUrl("/");
    render(
      <GnbNav
        isCategoryPanelOpen={false}
        onCategoryPanelOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("전체 카테고리").closest("a")).toHaveAttribute(
      "href",
      "/products",
    );
  });

  it("/products에서는 전체 카테고리만 active다", () => {
    setUrl("/products");
    render(
      <GnbNav
        isCategoryPanelOpen={false}
        onCategoryPanelOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("전체 카테고리")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("신상품")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("베스트")).not.toHaveAttribute("aria-current");
  });

  it("/products?preset=new에서는 신상품만 active다", () => {
    setUrl("/products", "preset=new");
    render(
      <GnbNav
        isCategoryPanelOpen={false}
        onCategoryPanelOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("신상품")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("전체 카테고리")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("/products?category=x에서는 전체 카테고리/신상품/베스트 전부 active가 아니다", () => {
    setUrl("/products", "category=키친다이닝");
    render(
      <GnbNav
        isCategoryPanelOpen={false}
        onCategoryPanelOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("전체 카테고리")).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText("신상품")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("베스트")).not.toHaveAttribute("aria-current");
  });

  describe("카테고리 메가패널 인터랙션", () => {
    beforeEach(() => {
      setUrl("/");
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function getContainer() {
      return screen.getByText("전체 카테고리").closest("a")!.parentElement!;
    }

    it("hover 150ms 후 패널이 열린다", () => {
      render(<ControlledGnbNav />);

      fireEvent.mouseEnter(getContainer());
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(150));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();
    });

    it("mouseLeave 300ms 후 패널이 닫힌다", () => {
      render(<ControlledGnbNav />);

      fireEvent.mouseEnter(getContainer());
      act(() => vi.advanceTimersByTime(150));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.mouseLeave(getContainer());
      act(() => vi.advanceTimersByTime(300));
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });

    it("Escape 키로 즉시 닫힌다", () => {
      render(<ControlledGnbNav />);

      fireEvent.mouseEnter(getContainer());
      act(() => vi.advanceTimersByTime(150));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });

    it("Escape로 닫히면 포커스가 트리거로 돌아온다(리뷰 F1)", () => {
      render(<ControlledGnbNav />);

      const trigger = screen.getByText("전체 카테고리").closest("a")!;
      fireEvent.focus(trigger);
      const subcategoryLink = screen.getByRole("link", { name: "다기 · 찻잔" });
      fireEvent.focus(subcategoryLink);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(document.activeElement).toBe(trigger);
    });

    it("바깥 클릭으로 즉시 닫힌다", () => {
      render(<ControlledGnbNav />);

      fireEvent.mouseEnter(getContainer());
      act(() => vi.advanceTimersByTime(150));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });

    it("트리거에 포커스를 주면 디바운스 없이 즉시 열린다", () => {
      render(<ControlledGnbNav />);

      fireEvent.focus(screen.getByText("전체 카테고리").closest("a")!);
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();
    });

    it("다른 대분류 탭에 포커스가 가면 그 탭의 소분류로 전환된다", () => {
      render(<ControlledGnbNav />);

      fireEvent.focus(screen.getByText("전체 카테고리").closest("a")!);
      fireEvent.focus(screen.getByRole("link", { name: "홈 · 인테리어" }));

      expect(
        screen.getByRole("link", { name: "화병 · 꽃" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });

    it("컨테이너 밖으로 포커스가 벗어나면 즉시 닫힌다", () => {
      render(<ControlledGnbNav />);

      const trigger = screen.getByText("전체 카테고리").closest("a")!;
      fireEvent.focus(trigger);
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.focusOut(trigger, { relatedTarget: document.body });
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });
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
