import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gnb } from "./gnb";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Gnb", () => {
  it("Header와 GnbNav를 함께 렌더한다", () => {
    render(<Gnb />);

    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "장바구니" })).toBeInTheDocument();
    expect(screen.getByText("전체 카테고리")).toBeInTheDocument();
    expect(screen.getByText("신상품")).toBeInTheDocument();
  });

  it("authStatus를 Header에 그대로 전달한다", () => {
    render(<Gnb authStatus="authenticated" />);

    expect(
      screen.getByRole("link", { name: "마이페이지" }),
    ).toBeInTheDocument();
  });

  /**
   * `CategoryMegaPanel`의 열림·닫힘·호버·키보드 처리는 전부 `Gnb`가 소유한다(§gnb.tsx
   * docblock — 패널이 헤더 전체 너비로 펼쳐져야 해서 `GnbNav`의 작은 컨테이너에서 여기로
   * 끌어올렸다).
   */
  describe("카테고리 메가패널", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function renderGnb() {
      const { container } = render(<Gnb />);
      const root = container.querySelector('[data-slot="gnb"]')!;
      const trigger = screen.getByText("전체 카테고리").closest("a")!;
      return { root, trigger };
    }

    it("트리거에 마우스를 올리면 80ms 후 패널이 열린다", () => {
      const { trigger } = renderGnb();

      fireEvent.mouseEnter(trigger);
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(80));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();
    });

    it("GNB 영역 전체를 벗어나면 150ms 후 닫힌다", () => {
      const { root, trigger } = renderGnb();

      fireEvent.mouseEnter(trigger);
      act(() => vi.advanceTimersByTime(80));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.mouseLeave(root);
      act(() => vi.advanceTimersByTime(150));
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });

    it("패널이 열린 채로 대분류 탭에 마우스를 올리면 그 탭으로 전환된다", () => {
      const { trigger } = renderGnb();

      fireEvent.mouseEnter(trigger);
      act(() => vi.advanceTimersByTime(80));
      fireEvent.mouseEnter(screen.getByRole("link", { name: "홈 · 인테리어" }));

      expect(
        screen.getByRole("link", { name: "화병 · 꽃" }),
      ).toBeInTheDocument();
    });

    it("닫혔다 다시 열리면 활성 탭이 첫 대분류로 초기화된다", () => {
      const { root, trigger } = renderGnb();

      fireEvent.mouseEnter(trigger);
      act(() => vi.advanceTimersByTime(80));
      fireEvent.mouseEnter(screen.getByRole("link", { name: "홈 · 인테리어" }));
      expect(
        screen.getByRole("link", { name: "화병 · 꽃" }),
      ).toBeInTheDocument();

      fireEvent.mouseLeave(root);
      act(() => vi.advanceTimersByTime(150));
      expect(
        screen.queryByRole("link", { name: "화병 · 꽃" }),
      ).not.toBeInTheDocument();

      fireEvent.mouseEnter(trigger);
      act(() => vi.advanceTimersByTime(80));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "화병 · 꽃" }),
      ).not.toBeInTheDocument();
    });

    it("Escape로 닫히면 포커스가 트리거로 돌아온다", () => {
      const { trigger } = renderGnb();

      fireEvent.mouseEnter(trigger);
      act(() => vi.advanceTimersByTime(80));
      fireEvent.focus(screen.getByRole("link", { name: "다기 · 찻잔" }));

      fireEvent.keyDown(document, { key: "Escape" });

      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("GNB 바깥을 클릭하면 즉시 닫힌다", () => {
      const { trigger } = renderGnb();

      fireEvent.mouseEnter(trigger);
      act(() => vi.advanceTimersByTime(80));

      fireEvent.mouseDown(document.body);
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });

    it("트리거에 포커스를 주면 디바운스 없이 즉시 열린다", () => {
      const { trigger } = renderGnb();

      fireEvent.focus(trigger);

      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();
    });
  });
});
