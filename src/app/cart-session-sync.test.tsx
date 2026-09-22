import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import { CartSessionSync } from "./cart-session-sync";

const merge = vi.hoisted(() => vi.fn());
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
vi.mock("@/queries/cart/mutations", () => ({
  useMergeGuestCartMutation: () => ({ mutateAsync: merge }),
}));

beforeEach(() => {
  merge.mockReset().mockResolvedValue(null);
  useAuthStore
    .getState()
    .setSession("token", { id: 1, name: "구매자", role: "USER" });
});

describe("CartSessionSync", () => {
  it("StrictMode에서도 병합 완료 후 한 번만 구매 화면을 연다", async () => {
    let finish!: () => void;
    merge.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <StrictMode>
        <CartSessionSync>구매 화면</CartSessionSync>
      </StrictMode>,
    );
    expect(screen.queryByText("구매 화면")).not.toBeInTheDocument();
    await waitFor(() => expect(merge).toHaveBeenCalledTimes(1));
    finish();
    expect(await screen.findByText("구매 화면")).toBeInTheDocument();
  });

  it("실패해도 세션을 유지하고 병합 재시도를 제공한다", async () => {
    merge.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<CartSessionSync>구매 화면</CartSessionSync>);
    expect(await screen.findByRole("alert")).toHaveTextContent("장바구니");
    expect(useAuthStore.getState().status).toBe("authenticated");
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(merge).toHaveBeenCalledTimes(2);
  });

  it("비회원은 병합 없이 바로 화면을 연다", () => {
    useAuthStore.getState().clear();
    render(<CartSessionSync>구매 화면</CartSessionSync>);
    expect(screen.getByText("구매 화면")).toBeInTheDocument();
    expect(merge).not.toHaveBeenCalled();
  });
});
