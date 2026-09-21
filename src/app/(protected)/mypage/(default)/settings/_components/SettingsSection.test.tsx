import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type DefaultBodyType, http, type PathParams } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { resetSettingsMock } from "@/api/member/mock/handlers";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

import { SettingsSection } from "./SettingsSection";

type Envelope = ApiResponse<unknown> | ApiErrorResponse;

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<SettingsSection />, { wrapper: Wrapper });
}

function findToggle(name: string) {
  return screen.findByRole("switch", { name });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
  resetSettingsMock();
  document.documentElement.classList.remove("dark");
});

describe("SettingsSection", () => {
  it("화면 설정·알림 설정 섹션과 각 토글 라벨을 보여준다", async () => {
    renderSection();

    expect(await screen.findByText("화면 설정")).toBeInTheDocument();
    expect(screen.getByText("알림 설정")).toBeInTheDocument();
    expect(await findToggle("다크모드 변경")).toBeInTheDocument();
    expect(await findToggle("주문 및 배송 알림받기")).toBeInTheDocument();
    expect(
      await findToggle("찜 목록 가격 변동 / 재입고 알림받기"),
    ).toBeInTheDocument();
    expect(
      await findToggle("마케팅 수신동의 ( SMS / E-mail )"),
    ).toBeInTheDocument();
  });

  it("조회 중에는 Skeleton을, 완료되면 실제 내용을 보여준다", async () => {
    let resolveGet: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      resolveGet = resolve;
    });
    server.use(
      http.get("*/api/member/settings", async () => {
        await pending;
        return mockOk({ darkMode: false, marketing: true });
      }),
    );
    const { container } = renderSection();

    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("화면 설정")).not.toBeInTheDocument();

    resolveGet();

    expect(await screen.findByText("화면 설정")).toBeInTheDocument();
  });

  it("조회에 실패하면 ErrorState를 보여주고, 다시 시도를 누르면 재조회한다", async () => {
    let requestCount = 0;
    server.use(
      http.get<PathParams, DefaultBodyType, Envelope>(
        "*/api/member/settings",
        () => {
          requestCount += 1;
          if (requestCount === 1) return mockError(500, "INTERNAL_ERROR");
          return mockOk({ darkMode: false, marketing: true });
        },
      ),
    );
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("문제가 발생했어요")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("화면 설정")).toBeInTheDocument();
  });

  it("시드 값대로 다크모드는 꺼짐, 알림 2종·마케팅은 켜짐으로 시작한다", async () => {
    renderSection();

    expect(await findToggle("다크모드 변경")).toHaveAttribute("data-unchecked");
    expect(await findToggle("주문 및 배송 알림받기")).toHaveAttribute(
      "data-checked",
    );
    expect(
      await findToggle("찜 목록 가격 변동 / 재입고 알림받기"),
    ).toHaveAttribute("data-checked");
    expect(
      await findToggle("마케팅 수신동의 ( SMS / E-mail )"),
    ).toHaveAttribute("data-checked");
  });

  it("다크모드 토글을 켜면 저장 mutation을 호출하고 html에 dark 클래스가 붙는다", async () => {
    const user = userEvent.setup();
    renderSection();
    const darkModeToggle = await findToggle("다크모드 변경");

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(darkModeToggle);

    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true),
    );
    await waitFor(() => expect(darkModeToggle).toHaveAttribute("data-checked"));
  });

  it("알림 2종 토글은 클릭 시 화면에만 반영되고 저장 요청을 보내지 않는다", async () => {
    const user = userEvent.setup();
    let patchCalled = false;
    server.use(
      http.patch("*/api/member/settings", () => {
        patchCalled = true;
        return mockError(500, "INTERNAL_ERROR");
      }),
    );
    renderSection();
    const orderToggle = await findToggle("주문 및 배송 알림받기");

    await user.click(orderToggle);

    expect(orderToggle).toHaveAttribute("data-unchecked");
    expect(patchCalled).toBe(false);
  });

  it("저장 요청이 진행 중인 동안 두 실연동 토글을 비활성화해 중복 저장을 막는다", async () => {
    const user = userEvent.setup();
    let resolvePatch: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      resolvePatch = resolve;
    });
    server.use(
      http.patch("*/api/member/settings", async () => {
        await pending;
        return mockOk({ darkMode: true, marketing: true });
      }),
    );
    renderSection();
    const darkModeToggle = await findToggle("다크모드 변경");
    const marketingToggle = await findToggle(
      "마케팅 수신동의 ( SMS / E-mail )",
    );

    await user.click(darkModeToggle);

    await waitFor(() =>
      expect(darkModeToggle).toHaveAttribute("data-disabled"),
    );
    expect(marketingToggle).toHaveAttribute("data-disabled");

    resolvePatch();

    await waitFor(() =>
      expect(darkModeToggle).not.toHaveAttribute("data-disabled"),
    );
    expect(marketingToggle).not.toHaveAttribute("data-disabled");
  });

  it("저장이 실패하면 마케팅 수신동의 토글이 원래 상태로 되돌아간다", async () => {
    const user = userEvent.setup();
    server.use(
      http.patch("*/api/member/settings", () =>
        mockError(500, "INTERNAL_ERROR"),
      ),
    );
    renderSection();
    const marketingToggle = await findToggle(
      "마케팅 수신동의 ( SMS / E-mail )",
    );
    expect(marketingToggle).toHaveAttribute("data-checked");

    await user.click(marketingToggle);

    await waitFor(() =>
      expect(marketingToggle).toHaveAttribute("data-checked"),
    );
  });
});
