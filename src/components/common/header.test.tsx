import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Header } from "./header";

describe("Header", () => {
  it("authStatus를 안 주면 anonymous로 취급해 로그인 링크를 렌더한다", () => {
    render(<Header />);

    const link = screen.getByRole("link", { name: "로그인" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("loading이면 스켈레톤을 보여주고 로그인/마이페이지 링크는 없다", () => {
    render(<Header authStatus="loading" />);

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

  it("검색 버튼은 href 없는 정적 button이다", () => {
    render(<Header />);

    expect(screen.getByRole("button", { name: "검색" })).toBeInTheDocument();
  });

  it("장바구니는 /cart로 가는 링크다", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "장바구니" })).toHaveAttribute(
      "href",
      "/cart",
    );
  });
});
