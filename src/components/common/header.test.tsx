import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "./header";

describe("Header", () => {
  it("authStatus를 안 주면 anonymous로 취급해 로그인 링크를 렌더한다", () => {
    render(<Header />);

    const link = screen.getByRole("link", { name: "로그인" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("loading이면 스켈레톤을 보여주고 로그인/마이페이지 링크는 없다", () => {
    const { container } = render(<Header authStatus="loading" />);

    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "로그인" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "마이페이지" }),
    ).not.toBeInTheDocument();
  });

  it("authenticated면 마이페이지 링크를 렌더한다", () => {
    render(<Header authStatus="authenticated" />);

    const link = screen.getByRole("link", { name: "마이페이지" });
    expect(link).toHaveAttribute("href", "/mypage");
  });

  it("onSearchTriggerClick을 안 주면 클릭해도 아무 동작 없는 정적 button이다", () => {
    render(<Header />);

    const button = screen.getByRole("button", { name: "검색" });
    expect(button).toBeInTheDocument();
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it("isSearchPanelOpen이 검색 버튼 aria-expanded에 반영된다", () => {
    const { rerender } = render(<Header isSearchPanelOpen={false} />);
    expect(screen.getByRole("button", { name: "검색" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    rerender(<Header isSearchPanelOpen={true} />);
    expect(screen.getByRole("button", { name: "검색" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("검색 버튼 클릭 시 onSearchTriggerClick이 호출된다", () => {
    const onSearchTriggerClick = vi.fn();
    render(<Header onSearchTriggerClick={onSearchTriggerClick} />);

    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(onSearchTriggerClick).toHaveBeenCalledTimes(1);
  });

  it("장바구니는 /cart로 가는 링크다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "장바구니" })).toHaveAttribute(
      "href",
      "/cart",
    );
  });
});
