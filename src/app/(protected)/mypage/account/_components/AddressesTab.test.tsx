import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { resetAddressMock } from "@/api/member/mock/handlers";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { useAuthStore } from "@/stores/auth";

import { AddressesTab } from "./AddressesTab";

vi.mock("react-daum-postcode", () => ({
  useKakaoPostcodePopup:
    () => async (options?: { onComplete?: (data: unknown) => void }) => {
      options?.onComplete?.({
        zonecode: "12345",
        roadAddress: "서울특별시 종로구 세종대로 1",
      });
    },
}));

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<AddressesTab />, { wrapper: Wrapper });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
  resetAddressMock();
});

describe("AddressesTab", () => {
  it("시드된 배송지 2건을 표시한다(첫 번째가 기본 배송지)", async () => {
    renderTab();

    expect(
      await screen.findByText("서울특별시 강남구 학동로 343"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("경기도 성남시 분당구 판교역로 235"),
    ).toBeInTheDocument();
    expect(screen.getByText("기본 배송지")).toBeInTheDocument();
  });

  it("추가하기 → 배송지 등록에 성공하면 목록에 새 항목이 보인다", async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByText("서울특별시 강남구 학동로 343");

    await user.click(screen.getByRole("button", { name: "추가하기" }));
    await user.type(screen.getByPlaceholderText("홍길동"), "새주소지");
    await user.type(screen.getAllByPlaceholderText("0000")[0], "5555");
    await user.type(screen.getAllByPlaceholderText("0000")[1], "6666");
    await user.click(screen.getByRole("button", { name: "주소검색" }));
    await user.type(
      await screen.findByPlaceholderText("상세주소"),
      "101동 101호",
    );
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "취소" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText("서울특별시 종로구 세종대로 1"),
    ).toBeInTheDocument();
  });

  it("삭제하면 목록에서 사라진다", async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByText("서울특별시 강남구 학동로 343");

    const cards = screen.getAllByText("배송지 삭제하기");
    await user.click(cards[1]);

    await waitFor(() =>
      expect(
        screen.queryByText("경기도 성남시 분당구 판교역로 235"),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText("서울특별시 강남구 학동로 343"),
    ).toBeInTheDocument();
  });

  it("기본 배송지로 설정하면 배지가 옮겨간다", async () => {
    const user = userEvent.setup();
    renderTab();
    await screen.findByText("서울특별시 강남구 학동로 343");

    await user.click(
      screen.getByRole("button", { name: "기본 배송지로 설정" }),
    );

    await waitFor(() => {
      const secondCard = screen
        .getByText("경기도 성남시 분당구 판교역로 235")
        .closest('[data-slot="address-card"]');
      expect(
        within(secondCard as HTMLElement).getByText("기본 배송지"),
      ).toBeInTheDocument();
    });
  });
});
