import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { orderFixtures } from "@/api/orders/mock/fixtures";
import { useAuthStore } from "@/stores/auth";

import OrderDetailPage from "./page";

// mutation 테스트가 실행 순서상 서로 다른 주문을 쓰도록, 파일 로드 시점(= 어떤
// mutation 테스트도 실행되기 전)에 필요한 주문 id를 한 번만 캡처한다(api.test.ts와
// 동일한 이유).
const deliveredOrderId = orderFixtures.find(
  (order) => order.status === "DELIVERED",
)!.orderId;
const inDeliveryOrderId = orderFixtures.find(
  (order) => order.status === "IN_DELIVERY",
)!.orderId;
const createdOrderId = orderFixtures.find(
  (order) => order.status === "CREATED",
)!.orderId;

let mockOrderId = String(deliveredOrderId);
vi.mock("next/navigation", () => ({
  useParams: () => ({ orderId: mockOrderId }),
}));

vi.mock("react-daum-postcode", () => ({
  useKakaoPostcodePopup:
    () => async (options?: { onComplete?: (data: unknown) => void }) => {
      options?.onComplete?.({
        zonecode: "12345",
        roadAddress: "서울특별시 종로구 세종대로 1",
      });
    },
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return render(<OrderDetailPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  useAuthStore.setState({ accessToken: SEED_ACCESS_TOKEN });
  setMockIdentity("USER");
});

describe("OrderDetailPage", () => {
  it("주문 상세(상품·배송지·결제 정보)를 보여준다", async () => {
    mockOrderId = String(deliveredOrderId);
    renderPage();

    expect(await screen.findByText(/주문번호 :/)).toBeInTheDocument();
    expect(screen.getByText("배송지")).toBeInTheDocument();
    expect(screen.getByText("결제 정보")).toBeInTheDocument();
  });

  it("존재하지 않는 주문은 안내와 함께 재시도 버튼 없이 보여준다", async () => {
    mockOrderId = "999999";
    renderPage();

    expect(
      await screen.findByText("주문을 찾을 수 없어요"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "다시 시도" }),
    ).not.toBeInTheDocument();
  });

  it("배송 조회 버튼 클릭 시 모달에 택배사·운송장번호·상태를 보여준다", async () => {
    const user = userEvent.setup();
    mockOrderId = String(inDeliveryOrderId);
    renderPage();

    await user.click(await screen.findByRole("button", { name: "배송 조회" }));
    expect(await screen.findByText(/CJ대한통운/)).toBeInTheDocument();
  });

  it("구매 확정 클릭 시 상태가 구매 확정으로 바뀐다", async () => {
    const user = userEvent.setup();
    mockOrderId = String(deliveredOrderId);
    renderPage();

    await user.click(await screen.findByRole("button", { name: "구매 확정" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "구매 확정" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "바로 구매하기" }),
    ).toBeInTheDocument();
  });

  it("배송지 변경 → 제출하면 배송지 패널에 반영된다", async () => {
    const user = userEvent.setup();
    mockOrderId = String(createdOrderId);
    renderPage();

    await user.click(
      (await screen.findAllByRole("button", { name: "배송지 변경" }))[0]!,
    );
    await user.click(screen.getByRole("button", { name: "주소검색" }));
    await user.click(screen.getByRole("button", { name: "변경" }));

    await waitFor(() =>
      expect(
        screen.getByText(/서울특별시 종로구 세종대로 1/),
      ).toBeInTheDocument(),
    );
  });
});
