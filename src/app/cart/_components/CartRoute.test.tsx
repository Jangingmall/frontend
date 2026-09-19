import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";

import { CartRoute } from "./CartRoute";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

afterEach(() => {
  useAuthStore.getState().clear();
  usePurchasePreviewStore.getState().resetPreview();
});

it("keeps authenticated purchases on the cart until checkout is available", async () => {
  useAuthStore.setState({ status: "authenticated" });
  const user = userEvent.setup();
  render(<CartRoute />);
  await user.click(screen.getByRole("button", { name: "2건 구매하기" }));
  expect(
    screen.getByText("주문·결제 화면은 준비 중입니다."),
  ).toBeInTheDocument();
  expect(push).not.toHaveBeenCalled();
  expect(usePurchasePreviewStore.getState().checkoutLines).toEqual([]);
});
