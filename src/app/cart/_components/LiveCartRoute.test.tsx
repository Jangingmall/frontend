import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { LiveCartRoute } from "./LiveCartRoute";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  useAuthStore.getState().clear();
  push.mockClear();
});
const item = (id: number, selected: boolean) => ({
  cartItemId: id,
  productId: id,
  productName: `상품${id}`,
  unitPrice: 10000,
  quantity: 1,
  subtotal: 10000,
  thumbnail: [],
  isCustomOrder: false,
  soldOut: false,
  selected,
  selectedOptions: [] as {
    optionGroupId: number;
    choiceId: number;
    name: string;
    choiceName: string;
  }[],
  textInputs: [] as { optionGroupId: number; name: string; text: string }[],
});
function setup(configured = false) {
  let items = [item(91, true), item(92, false)];
  if (configured) {
    items[0].selectedOptions = [
      { optionGroupId: 4, choiceId: 8, name: "색상", choiceName: "청자" },
    ];
    items[0].textInputs = [
      { optionGroupId: 5, name: "각인", text: "소중한 선물" },
    ];
  }
  server.use(
    http.get("*/api/payments/cart", () =>
      HttpResponse.json({
        success: true,
        data: {
          sections: [
            {
              artisanId: 1,
              artisanName: "장인",
              shippingFee: 3000,
              freeShippingThreshold: null,
              items,
            },
          ],
          totalPrice: 10000,
          totalShippingFee: 3000,
          totalCount: items.length,
        },
      }),
    ),
    http.delete("*/api/payments/cart/items/:id", ({ params }) => {
      items = items.filter((i) => i.cartItemId !== Number(params.id));
      return HttpResponse.json({ success: true, data: null });
    }),
    http.post("*/api/payments/cart/items", async ({ request }) => {
      const body = (await request.json()) as {
        productId: number;
        selectedOptions?: unknown;
        textInputs?: unknown;
      };
      if (
        configured &&
        (JSON.stringify(body.selectedOptions) !==
          JSON.stringify([{ optionGroupId: 4, choiceId: 8 }]) ||
          JSON.stringify(body.textInputs) !==
            JSON.stringify([{ optionGroupId: 5, text: "소중한 선물" }]))
      )
        return HttpResponse.json(
          { errorCode: "INVALID_INPUT" },
          { status: 400 },
        );
      items.push(item(body.productId, true));
      return HttpResponse.json({
        success: true,
        data: {
          sections: [
            {
              artisanId: 1,
              artisanName: "장인",
              shippingFee: 3000,
              freeShippingThreshold: null,
              items,
            },
          ],
          totalPrice: 20000,
          totalShippingFee: 3000,
          totalCount: items.length,
        },
      });
    }),
  );
  useAuthStore.setState({ status: "authenticated" });
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <LiveCartRoute />
    </QueryClientProvider>,
  );
}
it("keeps unselected lines on selected deletion and restores through the server", async () => {
  setup();
  const user = userEvent.setup();
  await screen.findByText("상품91");
  expect(screen.getAllByRole("button", { name: "옵션 변경" })[0]).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "선택 삭제" }));
  await user.click(screen.getByRole("button", { name: "삭제하기" }));
  await waitFor(() =>
    expect(screen.queryByText("상품91")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("상품92")).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "장바구니에 다시 추가" }),
  );
  await screen.findByText("상품91");
});
it("passes only selected numeric cart IDs to checkout", async () => {
  setup();
  await screen.findByText("상품91");
  await userEvent.click(screen.getByRole("button", { name: "1건 구매하기" }));
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith("/checkout/new?items=91"),
  );
});
it("does not navigate when a locally checked item is not orderable on the server", async () => {
  setup();
  await screen.findByText("상품91");
  await userEvent.click(screen.getByRole("checkbox", { name: "전체 선택" }));
  await userEvent.click(screen.getByRole("button", { name: "2건 구매하기" }));
  await screen.findByRole("alert");
  expect(push).not.toHaveBeenCalled();
});
it("shows a failed quantity change without changing the server quantity", async () => {
  setup();
  server.use(
    http.patch("*/api/payments/cart/items/91", () =>
      HttpResponse.json(
        { errorCode: "BUSINESS_RULE_VIOLATION" },
        { status: 409 },
      ),
    ),
  );
  await screen.findByText("상품91");
  await userEvent.click(screen.getAllByRole("button", { name: "증가" })[0]);
  await screen.findByRole("alert");
  expect(screen.getAllByRole("textbox")[0]).toHaveValue("1");
  expect(screen.getByRole("button", { name: "1건 구매하기" })).toBeEnabled();
});
it("blocks another write and checkout while a quantity request is pending", async () => {
  setup();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.patch("*/api/payments/cart/items/91", async () => {
      await gate;
      return HttpResponse.json(
        { errorCode: "BUSINESS_RULE_VIOLATION" },
        { status: 409 },
      );
    }),
  );
  await screen.findByText("상품91");
  await userEvent.click(screen.getAllByRole("button", { name: "증가" })[0]);
  expect(screen.getByRole("button", { name: "1건 구매하기" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "선택 삭제" })).toBeDisabled();
  release();
  await screen.findByRole("alert");
});

it("restores the exact variant and custom text instead of adding the base product", async () => {
  setup(true);
  const user = userEvent.setup();
  await screen.findByText("상품91");
  await user.click(screen.getByRole("button", { name: "상품91 삭제" }));
  await user.click(screen.getByRole("button", { name: "삭제하기" }));
  await waitFor(() =>
    expect(screen.queryByText("상품91")).not.toBeInTheDocument(),
  );
  await user.click(
    screen.getByRole("button", { name: "장바구니에 다시 추가" }),
  );
  await screen.findByText("상품91");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("preserves the option dialog and explains unavailable editing", async () => {
  setup(true);
  await screen.findByText("상품91");
  await userEvent.click(
    screen.getAllByRole("button", { name: "옵션 변경" })[0],
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByRole("button", { name: "변경하기" })).toBeDisabled();
  expect(
    screen.getByText(/상품 옵션 정보와 변경 기능은 준비 중/),
  ).toBeVisible();
});

it("keeps the cart heading, summary and retry action after an API error", async () => {
  server.use(http.get("*/api/payments/cart", () => HttpResponse.error()));
  useAuthStore.setState({ status: "authenticated" });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LiveCartRoute />
    </QueryClientProvider>,
  );
  await screen.findByRole("alert");
  expect(screen.getByRole("heading", { name: "장바구니" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "결제 정보" })).toBeVisible();
  expect(screen.getByRole("button", { name: "구매하기" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
});
