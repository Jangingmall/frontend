import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { ServerStudioReview } from "./ServerStudioReview";
const read = vi.hoisted(() => vi.fn());
vi.mock("@/lib/http/client", () => ({ clientFetch: read }));
function preview() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ServerStudioReview
        productId={731}
        width={774}
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
}
it("상품 정보 조회가 실패해도 실제 문서와 src 사진은 미리보기에 남는다", async () => {
  read.mockRejectedValue(new Error("조회 실패"));
  preview();
  await screen.findByText(/상품 기본정보를 불러오지 못했습니다/);
  expect(screen.getByText("저장 전 수정 문구")).toBeVisible();
  expect(screen.getByAltText("작품 대표 사진")).toHaveAttribute(
    "src",
    "https://example.com/photo.png",
  );
});
it("조회한 상품의 가격과 재고를 표시한다", async () => {
  read.mockResolvedValue({
    productId: 731,
    title: "실제 상품",
    price: 12000,
    stock: 3,
    status: "DRAFT",
  });
  preview();
  await screen.findByRole("heading", { name: "실제 상품" });
  expect(screen.getByText("3개")).toBeVisible();
  expect(screen.getAllByText("12,000원")).toHaveLength(2);
});
