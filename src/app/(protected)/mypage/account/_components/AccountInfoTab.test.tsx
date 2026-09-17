import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_ACCESS_TOKEN, SEED_LOGIN } from "@/api/member/mock/fixtures";
import {
  setDynamicMember,
  setMockIdentity,
} from "@/api/member/mock/mock-identity";
import { useAuthStore } from "@/stores/auth";

import { AccountInfoTab } from "./AccountInfoTab";

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<AccountInfoTab />, { wrapper: Wrapper });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("AccountInfoTab", () => {
  it("이름·이메일·휴대전화를 표시한다", async () => {
    renderTab();

    expect(await screen.findByText("김미담")).toBeInTheDocument();
    expect(screen.getByText(SEED_LOGIN.email)).toBeInTheDocument();
    expect(screen.getByText("01011112222")).toBeInTheDocument();
  });

  it("LOCAL 계정이면 간편로그인 행을 숨긴다", async () => {
    renderTab();

    expect(await screen.findByText("김미담")).toBeInTheDocument();
    expect(screen.queryByText("간편로그인")).not.toBeInTheDocument();
  });

  it("소셜 계정이면 간편로그인 행에 연동 배지를 보여준다", async () => {
    setDynamicMember({
      memberId: 1,
      email: SEED_LOGIN.email,
      name: "김미담",
      nickname: null,
      role: "USER",
      profileImageUrl: null,
      phone: "01011112222",
      authProvider: "KAKAO",
    });
    renderTab();

    expect(await screen.findByText("간편로그인")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "카카오 계정 연동됨" }),
    ).toBeInTheDocument();
  });

  it("'수정하기' 버튼을 누르면 같은 자리에 수정 폼이 인라인으로 열린다", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole("button", { name: "수정하기" }));

    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "수정하기" }),
    ).not.toBeInTheDocument();
  });

  it("수정 폼에서 '취소'를 누르면 조회 화면으로 되돌아간다", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole("button", { name: "수정하기" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(
      await screen.findByRole("button", { name: "수정하기" }),
    ).toBeInTheDocument();
  });
});
