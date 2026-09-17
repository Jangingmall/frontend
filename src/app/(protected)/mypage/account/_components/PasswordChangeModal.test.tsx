import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN, SEED_LOGIN } from "@/api/member/mock/fixtures";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { useAuthStore } from "@/stores/auth";

import { PasswordChangeModal } from "./PasswordChangeModal";

function renderModal(onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<PasswordChangeModal open onOpenChange={onOpenChange} />, {
    wrapper: Wrapper,
  });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("PasswordChangeModal", () => {
  it("새 비밀번호 확인이 일치하지 않으면 클라이언트 에러를 보여주고 제출하지 않는다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderModal(onOpenChange);

    await user.type(
      screen.getByPlaceholderText("현재 비밀번호"),
      SEED_LOGIN.password,
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "NewPassw0rd!");
    await user.type(
      screen.getByPlaceholderText("새 비밀번호 확인"),
      "다른값입니다",
    );
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      await screen.findByText("비밀번호가 일치하지 않아요."),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("현재 비밀번호가 맞으면 성공 후 모달을 닫는다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderModal(onOpenChange);

    await user.type(
      screen.getByPlaceholderText("현재 비밀번호"),
      SEED_LOGIN.password,
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "NewPassw0rd!");
    await user.type(
      screen.getByPlaceholderText("새 비밀번호 확인"),
      "NewPassw0rd!",
    );
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("현재 비밀번호가 틀리면 폼 레벨 에러를 보여준다", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(
      screen.getByPlaceholderText("현재 비밀번호"),
      "wrong-password",
    );
    await user.type(screen.getByPlaceholderText("새 비밀번호"), "NewPassw0rd!");
    await user.type(
      screen.getByPlaceholderText("새 비밀번호 확인"),
      "NewPassw0rd!",
    );
    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(
      await screen.findByText("현재 비밀번호가 일치하지 않습니다."),
    ).toBeInTheDocument();
  });
});
