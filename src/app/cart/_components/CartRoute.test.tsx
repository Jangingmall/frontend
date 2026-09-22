import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";
import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { CartRoute } from "./CartRoute";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

afterEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().clear();
  usePurchasePreviewStore.getState().resetPreview();
});

it("passes only selected cart items to checkout", async () => {
  useAuthStore.setState({ status: "authenticated" });
  usePurchasePreviewStore.getState().setLines(cartFixtures.base);
  const user = userEvent.setup();
  render(<CartRoute />);
  await user.click(screen.getByRole("button", { name: "2건 구매하기" }));
  expect(push).toHaveBeenCalledWith("/checkout/ui-preview-order");
  expect(usePurchasePreviewStore.getState().checkoutLines).toEqual(
    cartFixtures.base.slice(0, 2),
  );
});

it("starts empty instead of inventing sample items", () => {
  render(<CartRoute />);
  expect(screen.getByText("장바구니가 비어있습니다.")).toBeInTheDocument();
});
