import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const environment = vi.hoisted(() => ({ apiMocking: true }));
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { CheckoutEntry } from "./CheckoutEntry";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./RealCheckoutPage", () => ({
  RealCheckoutPage: ({ allowOrder = true }: { allowOrder?: boolean }) => (
    <div data-testid="live-checkout" data-allow-order={allowOrder}>
      실제 주문 화면
    </div>
  ),
}));
vi.mock("@/lib/env", () => ({ publicEnv: environment }));
describe("목업 결제 진입 경계", () => {
  beforeEach(() => {
    environment.apiMocking = true;
    usePurchasePreviewStore.getState().resetPreview();
  });
  it("예약된 ID에서는 샘플 화면을 제공한다", () => {
    render(<CheckoutEntry orderId="ui-preview-order" />);
    expect(screen.getByRole("heading", { name: "주문 결제" })).toBeVisible();
  });
  it("알 수 없는 주문에는 샘플을 반환하지 않는다", () => {
    render(<CheckoutEntry orderId="real-order" />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByTestId("live-checkout")).toHaveAttribute(
      "data-allow-order",
      "false",
    );
  });
  it("실제 API 모드에서는 예약된 ID도 샘플을 반환하지 않는다", () => {
    environment.apiMocking = false;
    render(<CheckoutEntry orderId="ui-preview-order" />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByTestId("live-checkout")).toHaveAttribute(
      "data-allow-order",
      "false",
    );
  });
});
