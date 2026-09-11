import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import { SiteGnb } from "./site-gnb";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
});

describe("SiteGnb", () => {
  it("loading이면 Gnb가 스켈레톤을 보여준다(로그인·마이페이지 링크 없음)", () => {
    render(<SiteGnb />);

    expect(
      screen.queryByRole("link", { name: "로그인" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "마이페이지" }),
    ).not.toBeInTheDocument();
  });

  it("anonymous면 로그인 링크를 보여준다", () => {
    useAuthStore.setState({ status: "anonymous" });
    render(<SiteGnb />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("authenticated면 마이페이지 링크를 보여준다", () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", roles: ["USER"] },
    });
    render(<SiteGnb />);

    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute(
      "href",
      "/mypage",
    );
  });
});
