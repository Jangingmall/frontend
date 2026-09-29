import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render as rtlRender,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { SiteGnb, useGnbSession } from "./site-gnb";

function render(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

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
      user: { id: 1, name: "김미담", role: "USER" },
    });
    render(<SiteGnb />);

    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute(
      "href",
      "/mypage",
    );
  });

  describe("GNB 분류", () => {
    it("백엔드 분류를 받아 메가패널에 ID 기반 링크로 그린다", async () => {
      render(<SiteGnb />);

      fireEvent.focus(screen.getByRole("link", { name: "전체 카테고리" }));

      expect(
        await screen.findByRole("link", { name: "키친 · 다이닝" }),
      ).toHaveAttribute("href", "/products?category=category-1");
      expect(screen.getByRole("link", { name: "다기 · 찻잔" })).toHaveAttribute(
        "href",
        "/products?category=subcategory-1",
      );
    });

    it("분류 조회가 실패하면 패널 안에 오류와 다시 시도를 보여주고, 재시도로 복구된다", async () => {
      let fail = true;
      server.use(
        http.get("*/api/products/categories", () =>
          fail
            ? HttpResponse.json({ message: "error" }, { status: 500 })
            : HttpResponse.json({
                success: true,
                data: [{ categoryId: 1, name: "키친·다이닝" }],
              }),
        ),
        http.get("*/api/products/subcategories", () =>
          HttpResponse.json({ success: true, data: [] }),
        ),
      );
      render(<SiteGnb />);
      fireEvent.focus(screen.getByRole("link", { name: "전체 카테고리" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "분류를 불러오지 못했습니다",
      );
      // 분류 영역만 실패하고 나머지 GNB는 그대로다.
      expect(screen.getByRole("link", { name: "신상품" })).toBeInTheDocument();

      fail = false;
      fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

      await waitFor(() =>
        expect(
          screen.getByRole("link", { name: "키친 · 다이닝" }),
        ).toBeInTheDocument(),
      );
    });
  });
});

describe("SiteGnb 모바일 메뉴 로그인 상태", () => {
  it("로그인 상태면 사용자 이름과 로그아웃이 보이고, 로그아웃하면 세션이 비워진다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", role: "USER" },
    });
    render(<SiteGnb />);

    fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const dialog = await screen.findByRole("dialog", { name: "전체 메뉴" });
    expect(
      within(dialog).getByRole("link", { name: "김미담" }),
    ).toHaveAttribute("href", "/mypage");

    fireEvent.click(within(dialog).getByRole("button", { name: "로그아웃" }));

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("anonymous"),
    );
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("로그아웃하면 전체화면 메뉴가 닫힌다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", role: "USER" },
    });
    render(<SiteGnb />);

    fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    fireEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("로그아웃 요청 중에 다시 호출해도 서버에는 한 번만 요청한다", async () => {
    let requests = 0;
    server.use(
      http.post("*/api/member/logout", async () => {
        requests += 1;
        await delay(100);
        return HttpResponse.json({ success: true, status: 200, data: null });
      }),
    );
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", role: "USER" },
    });
    const { result } = renderHook(() => useGnbSession());

    // 메뉴는 첫 클릭에 닫히지만, 같은 틱의 연속 호출도 훅이 스스로 막아야 한다.
    act(() => {
      result.current.onLogout();
      result.current.onLogout();
    });

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("anonymous"),
    );
    expect(requests).toBe(1);

    // 끝난 뒤에는 다시 로그아웃할 수 있다.
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", role: "USER" },
    });
    act(() => result.current.onLogout());
    await waitFor(() => expect(requests).toBe(2));
  });

  it("서버 로그아웃이 실패해도 클라이언트 세션은 정리한다", async () => {
    server.use(
      http.post("*/api/member/logout", () =>
        HttpResponse.json({ message: "error" }, { status: 500 }),
      ),
    );
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "t",
      user: { id: 1, name: "김미담", role: "USER" },
    });
    render(<SiteGnb />);

    fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    fireEvent.click(await screen.findByRole("button", { name: "로그아웃" }));

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe("anonymous"),
    );
  });
});
