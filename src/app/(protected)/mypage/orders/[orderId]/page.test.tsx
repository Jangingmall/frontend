import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_ACCESS_TOKEN } from "@/api/member/mock/fixtures";
import { setMockIdentity } from "@/api/member/mock/mock-identity";
import { orderFixtures } from "@/api/orders/mock/fixtures";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
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
// "배송지 변경"은 상품 준비 중(BE `PAID`)에만 노출된다 — 입금 확인 중(`CREATED`)은
// Figma 스펙시트(2080:112091) 재확인 결과 대상이 아니다(page.tsx canChangeAddress 참고).
const preparingOrderId = orderFixtures.find(
  (order) => order.status === "PAID",
)!.orderId;
const paymentPendingOrderId = orderFixtures.find(
  (order) => order.status === "CREATED",
)!.orderId;
// "구매 확정" 테스트가 첫 번째 DELIVERED 주문을 상태 변경하므로, 교환·환불 신청
// 테스트는 별개 주문을 써야 한다(위 주석과 동일한 이유).
const deliveredOrderIds = orderFixtures
  .filter((order) => order.status === "DELIVERED")
  .map((order) => order.orderId);
const secondDeliveredOrderId = deliveredOrderIds[1]!;
// 후기 작성 테스트는 실제로 성공 제출까지 하므로(위 두 주문과 상태가 겹치지 않게)
// 별개의 세 번째 DELIVERED 주문을 쓴다.
const thirdDeliveredOrderId = deliveredOrderIds[2]!;

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
    mockOrderId = String(preparingOrderId);
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

  it("배송지 변경 실패 시 모달 안에만 에러를 보여주고 페이지 배너와 중복 표시하지 않는다(독립 리뷰 Nit)", async () => {
    const user = userEvent.setup();
    mockOrderId = String(preparingOrderId);
    server.use(
      http.patch("*/api/payments/orders/:orderId/address", () =>
        mockError(422, "BUSINESS_RULE_VIOLATION", "배송지를 변경할 수 없어요"),
      ),
    );
    renderPage();

    await user.click(
      (await screen.findAllByRole("button", { name: "배송지 변경" }))[0]!,
    );
    await user.click(screen.getByRole("button", { name: "주소검색" }));
    await user.click(screen.getByRole("button", { name: "변경" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "요청을 완료할 수 없어요",
    );
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("배송지 변경 실패 후 모달을 닫았다 다시 열면 이전 오류가 남지 않는다(독립 리뷰 F3)", async () => {
    const user = userEvent.setup();
    mockOrderId = String(preparingOrderId);
    server.use(
      http.patch("*/api/payments/orders/:orderId/address", () =>
        mockError(422, "BUSINESS_RULE_VIOLATION"),
      ),
    );
    renderPage();

    await user.click(
      (await screen.findAllByRole("button", { name: "배송지 변경" }))[0]!,
    );
    await user.click(screen.getByRole("button", { name: "주소검색" }));
    await user.click(screen.getByRole("button", { name: "변경" }));
    await screen.findByRole("alert");

    await user.click(screen.getByRole("button", { name: "취소" }));
    await user.click(
      (await screen.findAllByRole("button", { name: "배송지 변경" }))[0]!,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("입금 확인 중에는 배송지 변경 버튼을 보여주지 않는다(Figma 스펙시트 2080:112091)", async () => {
    mockOrderId = String(paymentPendingOrderId);
    renderPage();

    expect(await screen.findByText("입금 확인 중")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "배송지 변경" }),
    ).not.toBeInTheDocument();
  });

  it("주문 취소하기 클릭 시 즉시 취소되지 않고 취소 요청 모달이 뜬다(T-29 정정)", async () => {
    const user = userEvent.setup();
    mockOrderId = String(paymentPendingOrderId);
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "주문 취소하기" }),
    );
    expect(
      screen.getByRole("heading", { name: "주문 취소 요청" }),
    ).toBeInTheDocument();
  });

  it("취소 사유를 고르고 등록하면 주문이 취소되고 모달이 닫힌다", async () => {
    const user = userEvent.setup();
    mockOrderId = String(paymentPendingOrderId);
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "주문 취소하기" }),
    );
    await user.click(screen.getByRole("combobox", { name: "취소 사유" }));
    await user.click(await screen.findByRole("option", { name: "단순 변심" }));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "주문 취소 요청" }),
      ).not.toBeInTheDocument(),
    );
    expect(await screen.findByText("주문 취소")).toBeInTheDocument();
  });

  it("교환·환불 신청 클릭 시 모달이 뜨고, 사진 없이는 제출되지 않는다(필수)", async () => {
    const user = userEvent.setup();
    mockOrderId = String(secondDeliveredOrderId);
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "교환 · 환불 신청" }),
    );
    expect(
      screen.getByRole("heading", { name: "교환 · 환불 신청" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "교환" }));
    await user.click(screen.getByRole("combobox", { name: "신청 사유" }));
    await user.click(
      await screen.findByRole("option", { name: "상품 파손/불량" }),
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(
      await screen.findByText("사진을 1장 이상 첨부해주세요."),
    ).toBeInTheDocument();
  });

  it("후기 작성 클릭 시 모달이 뜨고, 등록하면 버튼이 사라진다", async () => {
    const user = userEvent.setup();
    mockOrderId = String(thirdDeliveredOrderId);
    renderPage();

    await user.click(await screen.findByRole("button", { name: "후기 작성" }));
    expect(
      screen.getByRole("heading", { name: "후기 작성하기" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("review-rating-star-4"));
    await user.type(
      screen.getByRole("textbox", { name: "후기 본문" }),
      "정말 만족스러운 상품이었습니다.",
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "후기 작성" }),
      ).not.toBeInTheDocument(),
    );
  });
});
