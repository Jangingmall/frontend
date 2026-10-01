import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { fixture } from "@/api/seller-demo/mock/document";
import type { SellerContent } from "@/api/seller-studio/api";

import { DemoFrontendEditor } from "./DemoFrontendEditor";
import type { StudioDraft } from "./studio-contract";

const queries = vi.hoisted(() => ({ product: vi.fn() }));
vi.mock("@/queries/seller-studio/queries", () => ({
  useSellerProduct: queries.product,
}));
vi.mock("./StudioEditor", () => ({
  StudioEditor: ({
    draft,
    onEdit,
  }: {
    draft: StudioDraft;
    onEdit: (draft: StudioDraft) => void;
  }) => (
    <input
      aria-label="편집 내용"
      value={draft.product_name}
      onChange={(event) =>
        onEdit({ ...draft, product_name: event.target.value })
      }
    />
  ),
}));
it("상품 배경 재조회가 실패해도 미저장 편집을 유지한다", async () => {
  const content: SellerContent = {
    contentId: 1,
    productId: 1,
    status: "DRAFT",
    version: 1,
    reactDocument: fixture("1"),
  };
  const data = {
    productId: 1,
    title: "원본",
    price: 120000,
    stock: 5,
    status: "DRAFT",
  };
  queries.product.mockReturnValue({ data, isPending: false, isError: false });
  const view = render(<DemoFrontendEditor content={content} />);
  await userEvent.type(screen.getByLabelText("편집 내용"), " 수정");
  queries.product.mockReturnValue({ data, isPending: false, isError: true });
  view.rerender(<DemoFrontendEditor content={content} />);
  expect(screen.getByLabelText("편집 내용")).toHaveValue("원본 수정");
});
