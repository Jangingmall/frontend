import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
});
