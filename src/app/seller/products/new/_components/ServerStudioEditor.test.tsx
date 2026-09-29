import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import type { SellerContent } from "@/api/seller-studio/api";

import { ServerStudioEditor } from "./ServerStudioEditor";

const content: SellerContent = {
  contentId: 1,
  productId: 1,
  status: "DRAFT",
  version: 1,
  reactDocument: { schemaVersion: "1.0", canvasWidth: 774, root: [] },
};

function renderEditor() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ServerStudioEditor content={content} />
    </QueryClientProvider>,
  );
}

function reviewAndReturn() {
  fireEvent.click(screen.getByRole("button", { name: "최종 확인" }));
  expect(
    screen.queryByRole("button", { name: "편집 도움말" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "편집으로 돌아가기" }));
}

it("건너뛴 도움말은 검수 후 편집으로 돌아와도 닫힌 상태를 유지한다", () => {
  renderEditor();
  fireEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
  reviewAndReturn();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "편집 도움말" }));
  expect(
    screen.getByRole("dialog", { name: "처음 사용하시나요?" }),
  ).toBeVisible();
});

it("검수 후 편집으로 돌아오면 진행 중인 도움말 단계를 유지한다", () => {
  renderEditor();
  fireEvent.click(screen.getByRole("button", { name: "튜토리얼 시작하기" }));
  reviewAndReturn();
  expect(screen.getByRole("dialog", { name: "글과 사진 편집" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("button", { name: "완료" }));
  reviewAndReturn();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
