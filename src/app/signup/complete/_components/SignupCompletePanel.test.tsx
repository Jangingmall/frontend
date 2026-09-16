import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import { SignupCompletePanel } from "./SignupCompletePanel";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  useAuthStore.setState({ status: "anonymous", accessToken: null, user: null });
});

describe("SignupCompletePanel", () => {
  it("세션이 있으면 이름이 포함된 환영 문구를 보여준다", () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "홍길동", role: "USER" },
    });

    render(<SignupCompletePanel returnUrl={null} />);

    expect(
      screen.getByText("홍길동님의 가입을 환영합니다!"),
    ).toBeInTheDocument();
  });

  it("세션 없이(비로그인) 접근하면 /로 리다이렉트한다", async () => {
    render(<SignupCompletePanel returnUrl={null} />);

    expect(screen.queryByText(/가입을 환영합니다/)).not.toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("returnUrl로 이전 페이지로 돌아간다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "홍길동", role: "USER" },
    });
    const user = userEvent.setup();

    render(<SignupCompletePanel returnUrl="/products" />);
    await user.click(
      screen.getByRole("button", { name: "이전 페이지로 돌아가기" }),
    );

    expect(push).toHaveBeenCalledWith("/products");
  });

  it("returnUrl이 없으면 /로 돌아간다", async () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "token",
      user: { id: 1, name: "홍길동", role: "USER" },
    });
    const user = userEvent.setup();

    render(<SignupCompletePanel returnUrl={null} />);
    await user.click(
      screen.getByRole("button", { name: "이전 페이지로 돌아가기" }),
    );

    expect(push).toHaveBeenCalledWith("/");
  });
});
