import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import ProtectedLayout from "./layout";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/mypage/orders",
}));

beforeEach(() => {
  replace.mockClear();
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
});

describe("ProtectedLayout", () => {
  it("loading이면 로딩을 보여주고 리다이렉트하지 않는다", () => {
    render(<ProtectedLayout>보호된 화면</ProtectedLayout>);

    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(screen.queryByText("보호된 화면")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("anonymous면 현재 경로를 returnUrl로 담아 /login으로 replace한다", () => {
    useAuthStore.setState({ status: "anonymous" });

    render(<ProtectedLayout>보호된 화면</ProtectedLayout>);

    expect(replace).toHaveBeenCalledWith("/login?returnUrl=%2Fmypage%2Forders");
    expect(screen.queryByText("보호된 화면")).not.toBeInTheDocument();
  });

  it("authenticated면 children을 렌더한다", () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", roles: ["USER"] },
    });

    render(<ProtectedLayout>보호된 화면</ProtectedLayout>);

    expect(screen.getByText("보호된 화면")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
