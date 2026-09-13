import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Gnb } from "./gnb";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push }),
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

  /**
   * CM-3 검색 패널 — 카테고리와 같은 슬롯을 공유하며 상호 배타로 동작한다
   * (`temp/tasks/T-07-search-panel/design.md` §3.3). 카테고리와 달리 호버가 아니라 클릭
   * 토글이라 `vi.useFakeTimers()`가 필요 없다(회귀 테스트 제외).
   */
  describe("검색 패널", () => {
    function renderGnb() {
      const { container } = render(<Gnb />);
      const root = container.querySelector('[data-slot="gnb"]')!;
      const searchTrigger = screen.getByRole("button", { name: "검색" });
      return { root, searchTrigger };
    }

    it("검색 아이콘을 클릭하면 패널이 열리고 입력창에 자동 포커스된다", () => {
      const { searchTrigger } = renderGnb();

      fireEvent.click(searchTrigger);

      const input = screen.getByPlaceholderText("검색어를 입력해주세요.");
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
      expect(searchTrigger).toHaveAttribute("aria-expanded", "true");
    });

    it("검색 아이콘을 재클릭하면 닫힌다", () => {
      const { searchTrigger } = renderGnb();

      fireEvent.click(searchTrigger);
      fireEvent.click(searchTrigger);

      expect(
        screen.queryByPlaceholderText("검색어를 입력해주세요."),
      ).not.toBeInTheDocument();
      expect(searchTrigger).toHaveAttribute("aria-expanded", "false");
    });

    it("카테고리 패널이 열린 상태에서 검색 아이콘을 클릭하면 배타적으로 전환된다", () => {
      vi.useFakeTimers();
      const { searchTrigger } = renderGnb();
      const categoryTrigger = screen.getByText("전체 카테고리").closest("a")!;

      fireEvent.mouseEnter(categoryTrigger);
      act(() => vi.advanceTimersByTime(80));
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.click(searchTrigger);

      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("검색어를 입력해주세요."),
      ).toBeInTheDocument();
      vi.useRealTimers();
    });

    it("ESC로 닫히면 포커스가 검색 트리거로 돌아온다", () => {
      const { searchTrigger } = renderGnb();

      fireEvent.click(searchTrigger);
      fireEvent.keyDown(document, { key: "Escape" });

      expect(
        screen.queryByPlaceholderText("검색어를 입력해주세요."),
      ).not.toBeInTheDocument();
      expect(document.activeElement).toBe(searchTrigger);
    });

    it("GNB 바깥을 클릭하면 즉시 닫힌다", () => {
      const { searchTrigger } = renderGnb();

      fireEvent.click(searchTrigger);
      fireEvent.mouseDown(document.body);

      expect(
        screen.queryByPlaceholderText("검색어를 입력해주세요."),
      ).not.toBeInTheDocument();
    });

    /**
     * 회귀 테스트 — 가드(§gnb.tsx docblock)가 없으면 카테고리용 `scheduleClose` 타이머가
     * 검색 패널까지 닫혀 버린다(`temp/tasks/T-07-search-panel/design.md` §5-5).
     */
    it("검색 패널이 열린 동안 마우스가 GNB 밖으로 나가도 닫히지 않는다", () => {
      vi.useFakeTimers();
      const { root, searchTrigger } = renderGnb();

      fireEvent.click(searchTrigger);
      fireEvent.mouseLeave(root);
      act(() => vi.advanceTimersByTime(150));

      expect(
        screen.getByPlaceholderText("검색어를 입력해주세요."),
      ).toBeInTheDocument();
      vi.useRealTimers();
    });
  });
});
