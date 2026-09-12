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

  describe("카테고리 패널 열림 상태 소유(§3.4)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("GnbNav의 onCategoryPanelOpenChange가 Gnb의 openPanel state를 바꾼다", () => {
      render(<Gnb />);

      const container = screen
        .getByText("전체 카테고리")
        .closest("a")!.parentElement!;
      fireEvent.mouseEnter(container);
      act(() => vi.advanceTimersByTime(150));

      // openPanel === "category"로 바뀌었는지는 GnbNav가 받는 isCategoryPanelOpen을 통해
      // 실제로 패널이 마운트되는지로 검증한다(내부 state를 직접 안 들여다봄).
      expect(
        screen.getByRole("link", { name: "다기 · 찻잔" }),
      ).toBeInTheDocument();

      fireEvent.mouseLeave(container);
      act(() => vi.advanceTimersByTime(300));
      expect(
        screen.queryByRole("link", { name: "다기 · 찻잔" }),
      ).not.toBeInTheDocument();
    });
  });
});
