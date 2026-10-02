import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

import { ServerStudioReview } from "./ServerStudioReview";
const read = vi.hoisted(() => vi.fn());
vi.mock("@/lib/http/client", () => ({ clientFetch: read }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/seller/products/new/1",
  useSearchParams: () => new URLSearchParams(),
}));
beforeEach(() => {
  useAuthStore.setState({
    user: { id: 7, name: "판매자", role: "ARTISAN" },
    status: "authenticated",
    accessToken: null,
  });
});
function preview(width = 774) {
  const result = render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ServerStudioReview
        productId={731}
        width={width}
        images={{}}
        document={{
          schemaVersion: "1.0",
          canvasWidth: 774,
          root: [
            {
              id: "photo",
              type: "element",
              tag: "img",
              props: { src: "https://example.com/photo.png" },
            },
            { id: "text", type: "text", value: "저장 전 수정 문구" },
          ],
        }}
      />
    </QueryClientProvider>,
  );
  const frame =
    screen.getByTitle<HTMLIFrameElement>("상품 상세페이지 미리보기");
  fireEvent.load(frame);
  return { ...result, frame, content: within(frame.contentDocument!.body) };
}
it("상품 정보 조회가 실패해도 실제 문서와 src 사진은 미리보기에 남는다", async () => {
  read.mockRejectedValue(new Error("조회 실패"));
  const { content } = preview();
  await content.findByText(/상품 기본정보를 불러오지 못했습니다/);
  expect(content.getByText("저장 전 수정 문구")).toBeVisible();
  expect(content.getAllByAltText("작품 대표 사진")[0]).toHaveAttribute(
    "src",
    "https://example.com/photo.png",
  );
  expect(content.queryByText("0원")).not.toBeInTheDocument();
});
it("조회한 상품의 가격과 구매 가능한 재고 수량을 표시한다", async () => {
  read.mockResolvedValue({
    productId: 731,
    title: "실제 상품",
    price: 12000,
    stock: 3,
    status: "DRAFT",
  });
  const { content } = preview();
  await content.findByRole("heading", { name: "실제 상품", level: 1 });
  expect(content.getAllByText("12,000원").length).toBeGreaterThanOrEqual(2);
  fireEvent.click(content.getByRole("button", { name: "증가" }));
  fireEvent.click(content.getByRole("button", { name: "증가" }));
  expect(content.getByRole("button", { name: "증가" })).toBeDisabled();
  expect(content.getByTestId("purchase-total")).toHaveTextContent("36,000원");
});
it("실제 상세페이지의 구매 영역과 상세 메뉴를 제공하며 소비자 요청을 보내지 않는다", async () => {
  read.mockClear();
  read.mockResolvedValue({
    productId: 731,
    title: "실제 상품",
    price: 12000,
    stock: 3,
    status: "DRAFT",
  });
  const { content } = preview();
  await content.findByRole("heading", { name: "실제 상품", level: 1 });
  expect(
    content.getByRole("navigation", { name: "상품 상세 메뉴" }),
  ).toBeVisible();
  fireEvent.click(content.getByRole("button", { name: "구매하기" }));
  fireEvent.click(content.getByRole("button", { name: "장바구니" }));
  fireEvent.click(content.getByRole("button", { name: "찜하기" }));
  fireEvent.click(content.getByRole("button", { name: "문의하기" }));
  expect(content.getByText("등록된 후기가 없습니다.")).toBeVisible();
  expect(content.getByText("등록된 문의가 없습니다.")).toBeVisible();
  expect(content.getByRole("combobox", { name: "후기 정렬" })).toBeDisabled();
  expect(read).toHaveBeenCalledTimes(1);
  expect(read.mock.calls[0][0]).toBe("/api/products/731");
});
