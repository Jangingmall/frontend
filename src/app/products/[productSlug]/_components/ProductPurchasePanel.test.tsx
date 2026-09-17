import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import {
  productDetailActionHandlers,
  resetProductDetailActionState,
} from "@/api/products/mock/detail-action-handlers";
import { getProductDetailMock } from "@/api/products/mock/detail-fixtures";
import { publicEnv } from "@/lib/env";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";
import type { ProductDetail } from "@/types/product-detail";

import { ProductPurchasePanel } from "./ProductPurchasePanel";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

beforeEach(() => {
  Object.assign(publicEnv, { apiMocking: true });
  useAuthStore.getState().clear();
  resetProductDetailActionState();
});

function setup(id: number, overrides: Partial<ProductDetail> = {}) {
  const onNotify = vi.fn();
  const onRequireLogin = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ProductPurchasePanel
        product={{ ...getProductDetailMock(id)!, ...overrides }}
        onNotify={onNotify}
        onRequireLogin={onRequireLogin}
      />
    </QueryClientProvider>,
  );
  return { onNotify, onRequireLogin, client };
}

it.each([true])(
  "blocks missing required options for isMock=%s and focuses the first select",
  (isMock) => {
    const { onNotify, onRequireLogin } = setup(101, { isMock });
    fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
    expect(onNotify).toHaveBeenCalledWith("옵션을 선택하지 않았습니다");
    expect(screen.getAllByRole("combobox")[0]).toHaveFocus();
    expect(onRequireLogin).not.toHaveBeenCalled();
  },
);

it.each([true])(
  "requires login for an optionless cart and wishlist with isMock=%s",
  (isMock) => {
    const { onRequireLogin, onNotify, client } = setup(102, { isMock });
    fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
    fireEvent.click(screen.getByRole("button", { name: "찜하기" }));
    expect(onRequireLogin).toHaveBeenCalledTimes(2);
    expect(onNotify).not.toHaveBeenCalled();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  },
);

it.each([
  [102, "장바구니"],
  [103, "재입고 알림"],
] as const)(
  "does not start a mutation for non-mock product %s (%s)",
  async (id, button) => {
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "테스트",
      role: "USER",
    });
    const { onNotify, onRequireLogin, client } = setup(id, { isMock: false });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: button }));

    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(screen.getByRole("button", { name: button })).toBeDisabled();
    expect(onNotify).not.toHaveBeenCalled();
    expect(onRequireLogin).not.toHaveBeenCalled();
  },
);

it("loads real wish state and waits for server confirmation before changing it", async () => {
  Object.assign(publicEnv, { apiMocking: false });
  useAuthStore
    .getState()
    .setSession("mock-access-token", { id: 1, name: "구매자", role: "USER" });
  let wished = true;
  server.use(
    http.get("*/api/member/me/wishes", () =>
      mockOk({
        items: wished ? [{ productId: 102 }] : [],
        nextCursor: null,
        hasNext: false,
        totalCount: wished ? 1 : 0,
      }),
    ),
    http.delete("*/api/products/102/wish", () => {
      wished = false;
      return mockOk(null);
    }),
  );
  const { onNotify } = setup(102, { isMock: false });
  await userEvent.click(await screen.findByRole("button", { name: "찜 취소" }));
  await waitFor(() =>
    expect(onNotify).toHaveBeenCalledWith("찜한 작품에서 삭제했습니다."),
  );
  expect(screen.getByRole("button", { name: "찜하기" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.getByRole("button", { name: "구매하기" })).toBeDisabled();
  expect(screen.queryByLabelText("선택한 옵션")).not.toBeInTheDocument();
});

it.each([
  [102, "장바구니", "장바구니에 작품을 담았습니다."],
  [103, "재입고 알림", "재입고 알림을 신청했습니다."],
] as const)(
  "preserves the mutation for mock product %s (%s)",
  async (id, button, message) => {
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "테스트",
      role: "USER",
    });
    const { onNotify, client } = setup(id);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: button }));

    await waitFor(() => expect(onNotify.mock.calls[0]?.[0]).toBe(message));
    expect(client.getMutationCache().getAll()).toHaveLength(1);
    expect(client.getMutationCache().getAll()[0].state.status).toBe("success");
  },
);

it("allows declining an optional gift-only group before purchase", async () => {
  const user = userEvent.setup();
  const product = getProductDetailMock(101)!;
  const { onRequireLogin } = setup(101, {
    optionGroups: product.optionGroups.filter((group) => group.kind === "GIFT"),
    variants: null,
  });
  await user.click(screen.getByRole("combobox", { name: "선물 포장 (선택)" }));
  await user.click(await screen.findByRole("option", { name: "선택 안 함" }));
  fireEvent.click(screen.getByRole("button", { name: "장바구니" }));
  expect(onRequireLogin).toHaveBeenCalledOnce();
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(
    `${product.price.toLocaleString("ko-KR")}원`,
  );
  await user.click(screen.getByRole("combobox", { name: "선물 포장 (선택)" }));
  await user.click(
    await screen.findByRole("option", { name: "보자기 포장 (+3,000원)" }),
  );
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(2);
});

it("can add an optionless product again after removing its selection", async () => {
  const user = userEvent.setup();
  setup(102);
  await user.click(screen.getByRole("button", { name: /삭제$/ }));
  await user.click(screen.getByRole("button", { name: "작품 추가" }));
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(1);
});

it("shows a generated no-gift choice while excluding it from the cart request", async () => {
  const user = userEvent.setup();
  const product = getProductDetailMock(101)!;
  const cartRequest = vi.fn();
  server.use(
    http.post(
      "*/api/products/:productId/detail-actions/cart-items",
      async ({ request }) => {
        cartRequest(await request.json());
        return mockOk({ duplicate: false });
      },
    ),
  );
  useAuthStore.getState().setSession("mock-access-token", {
    id: 1,
    name: "테스트",
    role: "USER",
  });
  setup(101, {
    optionGroups: product.optionGroups.map((group) => ({
      ...group,
      values: group.values.filter((value) => value.label !== "선택 안 함"),
    })),
  });
  await user.click(screen.getByRole("combobox", { name: "색상 (필수)" }));
  await user.click(await screen.findByRole("option", { name: "백색" }));
  await user.click(await screen.findByRole("option", { name: "소 (15 cm)" }));
  await user.click(await screen.findByRole("option", { name: "선택 안 함" }));

  expect(screen.getByText("- 선물 포장: 선택 안 함")).toBeInTheDocument();
  const removeButton = screen.getByRole("button", {
    name: "백색 / 소 (15 cm) / 선택 안 함 삭제",
  });
  expect(screen.getByTestId("purchase-total")).toHaveTextContent("20,000원");
  await user.click(screen.getByRole("button", { name: "장바구니" }));
  await waitFor(() =>
    expect(cartRequest).toHaveBeenCalledWith({
      lines: [{ choices: { color: "white", size: "small" }, quantity: 1 }],
    }),
  );
  await user.click(removeButton);
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(/^0원$/);
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
    role: "USER",
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

it.each([
  [0, true],
  [null, true],
] as const)(
  "allows restock for sold-out stock %s with isMock=%s",
  (stock, isMock) => {
    const { onRequireLogin, onNotify, client } = setup(103, { stock, isMock });
    expect(screen.getByRole("button", { name: "품절" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "재입고 알림" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "재입고 알림" }));
    expect(onRequireLogin).toHaveBeenCalledOnce();
    expect(onNotify).not.toHaveBeenCalled();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  },
);

it("waits for all option choices and preserves completed cards when gift wrapping changes", async () => {
  const user = userEvent.setup();
  setup(101);
  const product = getProductDetailMock(101)!;
  await user.click(screen.getByRole("combobox", { name: "색상 (필수)" }));
  await user.click(await screen.findByRole("option", { name: "백색" }));
  expect(screen.getByRole("combobox", { name: "크기 (필수)" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await user.click(await screen.findByRole("option", { name: "소 (15 cm)" }));
  expect(screen.getByTestId("purchase-total")).toHaveTextContent(/^0원$/);
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
  await user.click(screen.getByRole("combobox", { name: "선물 포장 (선택)" }));
  await user.click(await screen.findByRole("option", { name: "선택 안 함" }));
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(2);
  expect(screen.getByTestId("purchase-total")).toHaveTextContent("66,000원");
  await user.click(screen.getByRole("combobox", { name: "선물 포장 (선택)" }));
  await user.click(
    await screen.findByRole("option", { name: "보자기 포장 (+3,000원)" }),
  );
  expect(screen.getAllByRole("button", { name: /삭제$/ })).toHaveLength(2);
  expect(screen.getByTestId("purchase-total")).toHaveTextContent("89,000원");
  await user.click(screen.getByRole("button", { name: /보자기 포장 삭제$/ }));
  expect(screen.getByTestId("purchase-total")).toHaveTextContent("20,000원");
  await user.click(screen.getByRole("button", { name: /선택 안 함 삭제$/ }));
  expect(screen.getByTestId("purchase-total")).toHaveTextContent("0원");
});
