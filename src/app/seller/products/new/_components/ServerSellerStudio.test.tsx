import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/http/api-error";
import { useAuthStore } from "@/stores/auth";

import { ServerSellerStudio } from "./ServerSellerStudio";
const queries = vi.hoisted(() => ({ content: vi.fn(), generation: vi.fn() }));
vi.mock("@/queries/seller-studio/queries", () => ({
  useSellerContent: queries.content,
  useGeneration: queries.generation,
}));
vi.mock("./SellerAccess", () => ({
  SellerAccess: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./ServerStudioEditor", () => ({
  ServerStudioEditor: () => (
    <textarea aria-label="편집 내용" defaultValue="원본" />
  ),
}));
beforeEach(() => {
  useAuthStore
    .getState()
    .setSession("test", { id: 1, name: "장인", role: "ARTISAN" });
  queries.generation.mockReturnValue({ data: undefined });
});
it.each([
  new Error("통신 실패"),
  new ApiError(404, { errorCode: "NOT_FOUND" }),
])("배경 재조회가 실패해도 편집기를 유지한다: %s", async (error) => {
  const data = { contentId: 1 };
  queries.content.mockReturnValue({ data, isError: false, isPending: false });
  const view = render(<ServerSellerStudio initialProductId={12} />);
  await userEvent.type(screen.getByLabelText("편집 내용"), " 수정");
  queries.content.mockReturnValue({
    data,
    isError: true,
    isPending: false,
    error,
  });
  view.rerender(<ServerSellerStudio initialProductId={12} />);
  expect(screen.getByLabelText("편집 내용")).toHaveValue("원본 수정");
  expect(screen.getByRole("alert")).toHaveTextContent("편집 내용은 유지");
});
it("DRAFT_READY는 이전 문서를 보여주거나 무한 생성 중으로 표시하지 않는다", () => {
  queries.generation.mockReturnValue({ data: { status: "DRAFT_READY" } });
  queries.content.mockReturnValue({ data: { contentId: 1 }, isPending: false });
  render(<ServerSellerStudio initialProductId={12} initialGenerationId={3} />);
  expect(
    screen.getByRole("heading", { name: "AI 초안 확인이 필요합니다" }),
  ).toBeVisible();
  expect(screen.queryByLabelText("편집 내용")).not.toBeInTheDocument();
});
