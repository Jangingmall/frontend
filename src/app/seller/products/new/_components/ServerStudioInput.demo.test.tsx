import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { createSellerDemoRuntime } from "@/api/seller-demo/client";
import {
  type SellerDemoId,
  sellerDemoScenarios,
} from "@/api/seller-demo/scenarios";
import { SellerStudioRuntimeContext } from "@/queries/seller-studio/runtime";

import { ServerStudioInput } from "./ServerStudioInput";

beforeEach(() => {
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    }),
  );
});

function setup(scenario: SellerDemoId) {
  const sample = sellerDemoScenarios[scenario];
  const runtime = {
    ...createSellerDemoRuntime(scenario, crypto.randomUUID()),
    uploadImage: vi.fn().mockResolvedValue("demo-photo"),
    initialInput: {
      values: {
        productName: sample.name,
        howMade: sample.making,
        careTips: sample.care,
      },
      files: [new File(["photo"], "photo.png", { type: "image/png" })],
    },
  };
  const createProduct = vi.spyOn(runtime.api, "createSellerProduct");
  const onStarted = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <SellerStudioRuntimeContext value={runtime}>
        <ServerStudioInput onStarted={onStarted} />
      </SellerStudioRuntimeContext>
    </QueryClientProvider>,
  );
  return { runtime, createProduct, onStarted };
}

it.each(["1", "2"] as const)(
  "시연 %s는 가격 모달 없이 10,000원·1개로 등록하고 생성한다",
  async (scenario) => {
    const { runtime, createProduct, onStarted } = setup(scenario);
    await userEvent.click(screen.getByRole("button", { name: "생성하기" }));
    expect(
      screen.queryByRole("dialog", { name: "상품 기본정보" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
    expect(createProduct).toHaveBeenCalledWith({
      title: sellerDemoScenarios[scenario].name,
      price: 10000,
      stock: 1,
    });
    const [productId] = onStarted.mock.calls[0];
    expect(await runtime.api.getSellerProduct(productId)).toMatchObject({
      price: 10000,
      stock: 1,
    });
    expect(screen.queryByLabelText("판매 가격 (원) *")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("재고 (개) *")).not.toBeInTheDocument();
  },
);

it("시연 업로드 실패 후 재시도해도 고정 가격·재고의 상품을 중복 등록하지 않는다", async () => {
  const { runtime, createProduct, onStarted } = setup("1");
  runtime.uploadImage.mockRejectedValueOnce(new Error("사진 업로드 실패"));
  await userEvent.click(screen.getByRole("button", { name: "생성하기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "사진 업로드 실패",
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "생성하기" }));
  await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
  expect(createProduct).toHaveBeenCalledOnce();
  expect(
    await runtime.api.getSellerProduct(onStarted.mock.calls[0][0]),
  ).toMatchObject({ price: 10000, stock: 1 });
});
