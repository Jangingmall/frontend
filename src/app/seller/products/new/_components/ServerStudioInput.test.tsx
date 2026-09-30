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
  await user.type(screen.getByLabelText("상품명"), "찻잔");
  await user.type(screen.getByLabelText("제작 과정 · 상품 설명"), "제작");
  await user.type(screen.getByLabelText("사용 · 보관 관리 방법"), "관리");
  await user.upload(
    screen.getByLabelText("사진 첨부"),
    new File(["x"], "photo.png", { type: "image/png" }),
  );
  await user.click(screen.getByRole("button", { name: "생성하기" }));
  expect(create).not.toHaveBeenCalled();
  await screen.findByRole("dialog", { name: "상품 기본정보" });
  await user.type(screen.getByLabelText("판매 가격 (원) *"), "10000");
  await user.type(screen.getByLabelText("재고 (개) *"), "3");
  await user.click(screen.getByRole("button", { name: "입력하고 생성하기" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("상품명")).toHaveAttribute("readonly");
  await user.click(screen.getByRole("button", { name: "닫기" }));
  upload.mockResolvedValue("img-1");
  generate.mockResolvedValue({
    productId: 12,
    generationId: 3,
    status: "QUEUED",
  });
  await user.click(screen.getByRole("button", { name: "생성하기" }));
  await waitFor(() => expect(onStarted).toHaveBeenCalledWith(12, 3));
  expect(create).toHaveBeenCalledTimes(1);
  expect(generate).toHaveBeenCalledWith(12, {
    productName: "찻잔",
    howMade: "제작",
    careTips: "관리",
    images: ["img-1"],
  });
});

it("기존 상품은 가격·재고 입력 없이 Figma의 네 입력 영역으로 생성한다", async () => {
  const user = userEvent.setup();
  upload.mockResolvedValue("img-2");
  generate.mockResolvedValue({
    productId: 731,
    generationId: 8,
    status: "QUEUED",
  });
  const onStarted = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ServerStudioInput productId={731} onStarted={onStarted} />
    </QueryClientProvider>,
  );
  expect(screen.queryByLabelText("판매 가격 (원) *")).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("상품명"), "달항아리");
  await user.type(
    screen.getByLabelText("제작 과정 · 상품 설명"),
    "흙으로 빚습니다",
  );
  await user.type(
    screen.getByLabelText("사용 · 보관 관리 방법"),
    "부드럽게 닦습니다",
  );
  await user.upload(
    screen.getByLabelText("사진 첨부"),
    new File(["x"], "photo.png", { type: "image/png" }),
  );
  await user.click(screen.getByRole("button", { name: "생성하기" }));
  await waitFor(() => expect(onStarted).toHaveBeenCalledWith(731, 8));
  expect(create).not.toHaveBeenCalled();
  expect(generate).toHaveBeenCalledWith(731, {
    productName: "달항아리",
    howMade: "흙으로 빚습니다",
    careTips: "부드럽게 닦습니다",
    images: ["img-2"],
  });
});
