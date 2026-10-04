import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import ProtectedLayout from "./layout";

const replace = vi.fn();
const route = vi.hoisted(() => ({ pathname: "/mypage/orders" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => route.pathname,
}));

beforeEach(() => {
  replace.mockClear();
  route.pathname = "/mypage/orders";
  window.history.replaceState(null, "", "/");
  useAuthStore.setState({ status: "loading", accessToken: null, user: null });
});

describe("ProtectedLayout", () => {
  it.each([
    "/checkout/ui-preview-order",
    "/checkout/ui-preview-order/complete",
  ])("시연 결제 경로 %s는 로그인 없이 표시한다", (pathname) => {
    route.pathname = pathname;
    useAuthStore.setState({ status: "anonymous" });
    render(<ProtectedLayout>시연 결제 화면</ProtectedLayout>);
    expect(screen.getByText("시연 결제 화면")).toBeVisible();
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    "/checkout/new",
    "/checkout/123/complete",
    "/checkout/ui-preview-order/other",
    "/mypage/orders",
  ])("실제·알 수 없는 경로 %s는 계속 로그인을 요구한다", (pathname) => {
    route.pathname = pathname;
    useAuthStore.setState({ status: "anonymous" });
    render(<ProtectedLayout>보호된 화면</ProtectedLayout>);
    expect(screen.queryByText("보호된 화면")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(
      `/login?returnUrl=${encodeURIComponent(pathname)}`,
    );
  });

  it("로그인 뒤 결제 콜백과 선택 상품의 쿼리 파라미터를 보존한다", () => {
    window.history.replaceState(
      null,
      "",
      "/?paymentKey=pk-test&orderId=ORD-1&amount=85000",
    );
    useAuthStore.setState({ status: "anonymous" });
    render(<ProtectedLayout>보호된 화면</ProtectedLayout>);
    expect(replace).toHaveBeenCalledWith(
      `/login?returnUrl=${encodeURIComponent("/mypage/orders?paymentKey=pk-test&orderId=ORD-1&amount=85000")}`,
    );
  });
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
      user: { id: 1, name: "김미담", role: "USER" },
    });

    render(<ProtectedLayout>보호된 화면</ProtectedLayout>);

    expect(screen.getByText("보호된 화면")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
