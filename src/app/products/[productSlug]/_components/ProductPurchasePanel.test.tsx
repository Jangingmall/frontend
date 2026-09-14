import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import { productDetailActionHandlers } from "@/api/products/mock/detail-action-handlers";
import { getProductDetailMock } from "@/api/products/mock/detail-fixtures";
import { mockError } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";
import type { ProductDetail } from "@/types/product-detail";

import { ProductPurchasePanel } from "./ProductPurchasePanel";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

beforeEach(() => useAuthStore.getState().clear());

function setup(id: number, overrides: Partial<ProductDetail> = {}) {
  const onNotify = vi.fn();
  const onRequireLogin = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ProductPurchasePanel
        product={{ ...getProductDetailMock(id)!, ...overrides }}
        onNotify={onNotify}
        onRequireLogin={onRequireLogin}
      />
    </QueryClientProvider>,
  );
  return { onNotify, onRequireLogin };
}

it("blocks missing required options and focuses the first select", () => {
  const { onNotify, onRequireLogin } = setup(101);
  fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
  expect(onNotify).toHaveBeenCalledWith("필수 옵션을 선택해 주세요.");
  expect(screen.getAllByRole("combobox")[0]).toHaveFocus();
  expect(onRequireLogin).not.toHaveBeenCalled();
});

it("requires login for an optionless cart and wishlist", () => {
  const { onRequireLogin } = setup(102);
  fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
  fireEvent.click(screen.getByRole("button", { name: "찜하기" }));
  expect(onRequireLogin).toHaveBeenCalledTimes(2);
});

it("allows purchase without choosing an optional gift-only group", async () => {
  const user = userEvent.setup();
  const product = getProductDetailMock(101)!;
  const { onRequireLogin } = setup(101, {
    optionGroups: product.optionGroups.filter((group) => group.kind === "GIFT"),
    variants: null,
  });
  fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
  expect(onRequireLogin).toHaveBeenCalledOnce();
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(
    `${product.price.toLocaleString("ko-KR")}원`,
  );
  await user.click(screen.getByRole("combobox", { name: "선물 포장 (선택)" }));
  await user.click(
    screen.getByRole("option", { name: "보자기 포장 (+3,000원)" }),
  );
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(1);
});

it("can add an optionless product again after removing its selection", async () => {
  const user = userEvent.setup();
  setup(102);
  await user.click(screen.getByRole("button", { name: /삭제$/ }));
  await user.click(screen.getByRole("button", { name: "작품 추가" }));
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(1);
});

it("rolls wishlist back when the server rejects the change", async () => {
  server.use(...productDetailActionHandlers);
  server.use(
    http.put("*/api/products/:productId/detail-actions/wishlist", () =>
      mockError(500, "INTERNAL_ERROR"),
    ),
  );
  useAuthStore.getState().setSession("mock-access-token", {
    id: 1,
    name: "테스트",
    roles: ["USER"],
  });
  const { onNotify } = setup(102);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "찜하기" }));
  await waitFor(() =>
    expect(onNotify).toHaveBeenCalledWith(
      "찜을 변경하지 못했습니다. 다시 시도해 주세요.",
    ),
  );
  expect(screen.getByRole("button", { name: "찜하기" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});

it("disables purchase for unknown stock", () => {
  setup(106);
  expect(screen.getByRole("button", { name: "구매하기" })).toBeDisabled();
  expect(screen.getByText("재고를 확인 중입니다.")).toBeInTheDocument();
});

it.each([0, null])("allows restock for sold-out stock %s", (stock) => {
  const { onRequireLogin } = setup(103, { stock });
  expect(screen.getByRole("button", { name: "품절" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "재입고 알림" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "재입고 알림" }));
  expect(onRequireLogin).toHaveBeenCalledOnce();
});

it("opens the next option, adds a card and applies gift wrapping without adding a second product", async () => {
  const user = userEvent.setup();
  setup(101);
  const product = getProductDetailMock(101)!;
  await user.click(screen.getByRole("combobox", { name: "색상 (필수)" }));
  await user.click(screen.getByRole("option", { name: "백색" }));
  expect(screen.getByRole("combobox", { name: "크기 (필수)" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await user.click(await screen.findByRole("option", { name: "소 (15 cm)" }));
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(
    `${product.price.toLocaleString("ko-KR")}원`,
  );
  await user.click(
    await screen.findByRole("option", { name: "보자기 포장 (+3,000원)" }),
  );
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(
    `${(product.price + 3000).toLocaleString("ko-KR")}원`,
  );
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "증가" }));
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(
    `${((product.price + 3000) * 2).toLocaleString("ko-KR")}원`,
  );
  await user.click(screen.getByRole("button", { name: /삭제$/ }));
  expect(screen.getByTestId("purchase-total")).toHaveTextContent("0원");
});
