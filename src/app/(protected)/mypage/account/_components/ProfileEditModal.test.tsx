import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { useAuthStore } from "@/stores/auth";
import type { MemberProfile } from "@/types/member";

import { ProfileEditModal } from "./ProfileEditModal";

const LOCAL_PROFILE: MemberProfile = {
  id: 1,
  name: "김미담",
  email: "user@midam.test",
  phone: "01011112222",
  authProvider: "local",
  role: "USER",
};

function renderModal(profile: MemberProfile, onOpenChange = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(
    <ProfileEditModal open onOpenChange={onOpenChange} profile={profile} />,
    { wrapper: Wrapper },
  );
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("ProfileEditModal", () => {
  it("기존 이름·휴대전화 값으로 폼을 채우고 이메일은 읽기 전용이다", () => {
    renderModal(LOCAL_PROFILE);

    expect(screen.getByDisplayValue("김미담")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1111")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2222")).toBeInTheDocument();
    const emailInput = screen.getByDisplayValue("user@midam.test");
    expect(emailInput).toBeDisabled();
  });

  it("제출하면 갱신 성공 시 모달을 닫는다", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderModal(LOCAL_PROFILE, onOpenChange);

    const nameInput = screen.getByDisplayValue("김미담");
    await user.clear(nameInput);
    await user.type(nameInput, "새이름");
    await user.click(screen.getByRole("button", { name: "수정 완료하기" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("소셜 계정이면 간편로그인 연동 정보를 읽기 전용으로 보여준다", () => {
    renderModal({ ...LOCAL_PROFILE, authProvider: "kakao" });

    expect(screen.getByDisplayValue("카카오 연동됨")).toBeInTheDocument();
  });
});
