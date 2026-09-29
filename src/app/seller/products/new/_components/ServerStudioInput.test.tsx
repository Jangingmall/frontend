import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { ServerStudioInput } from "./ServerStudioInput";
const create = vi.hoisted(() => vi.fn());
const upload = vi.hoisted(() => vi.fn());
const generate = vi.hoisted(() => vi.fn());
vi.mock("@/api/seller-studio/api", () => ({
  createSellerProduct: create,
  startGeneration: generate,
}));
vi.mock("@/api/images/api", () => ({ uploadPublicImage: upload }));
beforeEach(() => {
  create.mockReset().mockResolvedValue({ productId: 12 });
  upload.mockReset().mockRejectedValue(new Error("업로드 실패"));
  generate.mockReset();
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    }),
  );
});
it("상품 등록 뒤 업로드 실패 시 등록된 기본정보를 잠그고 같은 상품으로 재시도한다", async () => {
  const user = userEvent.setup();
  const onStarted = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { mutations: { retry: false } } })
      }
    >
      <ServerStudioInput onStarted={onStarted} />
    </QueryClientProvider>,
  );
  await user.type(screen.getByLabelText("작품명 *"), "찻잔");
  await user.type(screen.getByLabelText("판매 가격 (원) *"), "10000");
  await user.type(screen.getByLabelText("재고 (개) *"), "3");
  await user.type(screen.getByLabelText("제작 과정 *"), "제작");
  await user.type(screen.getByLabelText("관리 방법 *"), "관리");
  await user.upload(
    screen.getByLabelText("사진 첨부"),
    new File(["x"], "photo.png", { type: "image/png" }),
  );
  await user.click(screen.getByRole("button", { name: "AI 상세페이지 생성" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("판매 가격 (원) *")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("재고 (개) *")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("작품명 *")).toHaveAttribute("readonly");
  upload.mockResolvedValue("img-1");
  generate.mockResolvedValue({
    productId: 12,
    generationId: 3,
    status: "QUEUED",
  });
  await user.click(screen.getByRole("button", { name: "AI 상세페이지 생성" }));
  await waitFor(() => expect(onStarted).toHaveBeenCalledWith(12, 3));
  expect(create).toHaveBeenCalledTimes(1);
  expect(generate).toHaveBeenCalledWith(12, {
    productName: "찻잔",
    howMade: "제작",
    careTips: "관리",
    images: ["img-1"],
  });
});
