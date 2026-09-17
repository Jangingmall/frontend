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

import { PasswordChangeTab } from "./PasswordChangeTab";

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<PasswordChangeTab />, { wrapper: Wrapper });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("PasswordChangeTab", () => {
  it("비밀번호 확인이 일치하지 않으면 클라이언트 에러를 보여주고 제출하지 않는다", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(
      await screen.findByPlaceholderText("현재 비밀번호"),
      SEED_LOGIN.password,
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "NewPassw0rd!");
    await user.type(
      screen.getByPlaceholderText("비밀번호 확인"),
      "다른값입니다",
    );
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      await screen.findByText("비밀번호가 일치하지 않아요."),
    ).toBeInTheDocument();
  });

  it("현재 비밀번호가 맞으면 성공 메시지를 보여준다", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(
      await screen.findByPlaceholderText("현재 비밀번호"),
      SEED_LOGIN.password,
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "NewPassw0rd!");
    await user.type(
      screen.getByPlaceholderText("비밀번호 확인"),
      "NewPassw0rd!",
    );
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      await screen.findByText("비밀번호가 변경되었습니다."),
    ).toBeInTheDocument();
  });

  it("새 비밀번호를 입력하면 안전도 표시가 갱신된다", async () => {
    const user = userEvent.setup();
    renderTab();

    const newPasswordInput = await screen.findByPlaceholderText("새 비밀번호");
    await user.type(newPasswordInput, "NewPassw0rd!");

    expect(await screen.findByText("비밀번호 안전도")).toBeInTheDocument();
    expect(screen.getByText("매우 높음")).toBeInTheDocument();
  });

  it("영문·숫자·특수기호 중 3가지 미만이면 제출하지 않는다", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(
      await screen.findByPlaceholderText("현재 비밀번호"),
      SEED_LOGIN.password,
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "onlylower1");
    await user.type(screen.getByPlaceholderText("비밀번호 확인"), "onlylower1");
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      await screen.findByText(
        "영문 대/소문자, 숫자, 특수기호(!,@,#,$,%) 중 3가지 이상 포함해주세요.",
      ),
    ).toBeInTheDocument();
  });

  it("'취소'를 누르면 입력한 값을 모두 지운다", async () => {
    const user = userEvent.setup();
    renderTab();

    const newPasswordInput = await screen.findByPlaceholderText("새 비밀번호");
    await user.type(newPasswordInput, "NewPassw0rd!");
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(newPasswordInput).toHaveValue("");
  });

  it("현재 비밀번호가 틀리면 폼 레벨 에러를 보여준다", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(
      await screen.findByPlaceholderText("현재 비밀번호"),
      "wrong-password",
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "NewPassw0rd!");
    await user.type(
      screen.getByPlaceholderText("비밀번호 확인"),
      "NewPassw0rd!",
    );
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      await screen.findByText("현재 비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("소셜 계정이면 폼 대신 안내 문구를 보여준다", async () => {
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

    expect(
      await screen.findByText("간편로그인 계정은 비밀번호가 없어요"),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("현재 비밀번호"),
    ).not.toBeInTheDocument();
  });
});
