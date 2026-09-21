import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { resetSettingsMock } from "@/api/member/mock/handlers";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { SettingsSection } from "./SettingsSection";

/** 렌더 순서: 0 다크모드 · 1 주문/배송 알림 · 2 찜 알림 · 3 마케팅 수신동의. */
const TOGGLE_INDEX = {
  darkMode: 0,
  orderNotification: 1,
  wishlistNotification: 2,
  marketing: 3,
} as const;

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

async function findToggles() {
  return screen.findAllByRole("switch");
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
    expect(screen.getByText("다크모드 변경")).toBeInTheDocument();
    expect(screen.getByText("알림 설정")).toBeInTheDocument();
    expect(screen.getByText("주문 및 배송 알림받기")).toBeInTheDocument();
    expect(
      screen.getByText("찜 목록 가격 변동 / 재입고 알림받기"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("마케팅 수신동의 ( SMS / E-mail )"),
    ).toBeInTheDocument();
    expect(await findToggles()).toHaveLength(4);
  });

  it("시드 값대로 다크모드는 꺼짐, 알림 2종·마케팅은 켜짐으로 시작한다", async () => {
    renderSection();
    const toggles = await findToggles();

    expect(toggles[TOGGLE_INDEX.darkMode]).toHaveAttribute("data-unchecked");
    expect(toggles[TOGGLE_INDEX.orderNotification]).toHaveAttribute(
      "data-checked",
    );
    expect(toggles[TOGGLE_INDEX.wishlistNotification]).toHaveAttribute(
      "data-checked",
    );
    expect(toggles[TOGGLE_INDEX.marketing]).toHaveAttribute("data-checked");
  });

  it("다크모드 토글을 켜면 저장 mutation을 호출하고 html에 dark 클래스가 붙는다", async () => {
    const user = userEvent.setup();
    renderSection();
    const toggles = await findToggles();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(toggles[TOGGLE_INDEX.darkMode]!);

    await waitFor(() =>
      expect(document.documentElement.classList.contains("dark")).toBe(true),
    );
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
    const toggles = await findToggles();

    await user.click(toggles[TOGGLE_INDEX.orderNotification]!);

    expect(toggles[TOGGLE_INDEX.orderNotification]).toHaveAttribute(
      "data-unchecked",
    );
    expect(patchCalled).toBe(false);
  });

  it("저장이 실패하면 마케팅 수신동의 토글이 원래 상태로 되돌아간다", async () => {
    const user = userEvent.setup();
    server.use(
      http.patch("*/api/member/settings", () =>
        mockError(500, "INTERNAL_ERROR"),
      ),
    );
    renderSection();
    const toggles = await findToggles();
    const marketingToggle = toggles[TOGGLE_INDEX.marketing]!;
    expect(marketingToggle).toHaveAttribute("data-checked");

    await user.click(marketingToggle);

    await waitFor(() =>
      expect(marketingToggle).toHaveAttribute("data-checked"),
    );
  });
});
