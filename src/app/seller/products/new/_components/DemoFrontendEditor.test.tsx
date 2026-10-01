import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { type DefaultBodyType, http, type HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import { fixture } from "@/api/seller-demo/mock/document";
import {
  createSellerStudioApi,
  type SellerContent,
} from "@/api/seller-studio/api";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import {
  type SellerStudioRuntime,
  SellerStudioRuntimeContext,
} from "@/queries/seller-studio/runtime";

import { createDemoDraft, demoStorageKey } from "./demo-editor-document";
import { DemoFrontendEditor } from "./DemoFrontendEditor";
import {
  type DemoDocumentSnapshot,
  parseDemoDocumentSnapshot,
} from "./document-editor-storage";

const product = {
  productId: 12,
  title: "입력한 작품명",
  price: 50000,
  stock: 3,
  status: "DRAFT",
};
const content: SellerContent = {
  productId: 12,
  contentId: 18,
  status: "DRAFT",
  version: 1,
  reactDocument: fixture("1"),
};
let failedQuery: boolean;
let productRequests: number;
beforeEach(() => {
  failedQuery = false;
  productRequests = 0;
  localStorage.clear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 200,
    bottom: 240,
    left: 300,
    right: 800,
    width: 500,
    height: 40,
    x: 300,
    y: 200,
    toJSON: () => ({}),
  });
  server.use(
    http.get("*/api/products/12", (): HttpResponse<DefaultBodyType> => {
      productRequests++;
      return failedQuery ? mockError(503, "UNAVAILABLE") : mockOk(product);
    }),
  );
});
async function setup(restored?: DemoDocumentSnapshot) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const runtime: SellerStudioRuntime = {
    api: createSellerStudioApi(),
    uploadImage: async () => {
      throw new Error("데모에서 서버 업로드를 호출하면 안 됩니다.");
    },
    demo: true,
    studioUrl: () => "/seller/products/new/1",
  };
  const view = render(
    <QueryClientProvider client={client}>
      <SellerStudioRuntimeContext value={runtime}>
        <DemoFrontendEditor
          content={restored ? undefined : content}
          restored={restored}
        />
      </SellerStudioRuntimeContext>
    </QueryClientProvider>,
  );
  await screen.findByRole("button", {
    name: restored?.review ? "뒤로가기" : "미리보기",
  });
  if (!restored?.review)
    fireEvent.click(screen.getByRole("button", { name: "도움말 닫기" }));
  return { ...view, client };
}
function editFirst(value: string) {
  const node = screen.getAllByRole("textbox", { name: "텍스트 편집" })[0];
  node.textContent = value;
  fireEvent.blur(node);
}
it("상품 백그라운드 재조회가 실패해도 현재 편집 문구를 유지한다", async () => {
  const { client } = await setup();
  editFirst("재조회 실패에도 유지");
  failedQuery = true;
  await act(async () => {
    await client.refetchQueries();
  });
  expect(productRequests).toBe(2);
  expect(screen.getByText("재조회 실패에도 유지")).toBeVisible();
});
it("전체 편집본과 브라우저 업로드 사진을 저장하고 미리보기로 독립 복원한다", async () => {
  const view = await setup();
  editFirst("복원된 전체 편집본");
  fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
  fireEvent.change(screen.getByLabelText("편집 사진 첨부"), {
    target: {
      files: [new File(["photo"], "photo.png", { type: "image/png" })],
    },
  });
  await screen.findByRole("button", { name: "사진 9 사용" });
  fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
  fireEvent.click(screen.getByRole("button", { name: "임시 저장" }));
  await screen.findByText("임시 저장되었습니다");
  const restored = parseDemoDocumentSnapshot(
    localStorage.getItem(demoStorageKey("1"))!,
  );
  expect(restored.review).toBe(true);
  expect(restored.product).toEqual(product);
  expect(Object.values(restored.images)).toContain(
    "data:image/png;base64,cGhvdG8=",
  );
  expect(window.location.search).toBe("?draft=1");
  view.unmount();
  productRequests = 0;
  const next = await setup(restored);
  expect(next.container.querySelector(".ss-product-detail")).toHaveTextContent(
    "복원된 전체 편집본",
  );
  expect(screen.getByText("입력한 작품명")).toBeVisible();
  expect(productRequests).toBe(0);
});
it("이전 데모 저장본의 수정 내용을 실제 공통 UI에 복원한다", async () => {
  const source = fixture("1");
  const { draft, assets } = createDemoDraft(source, "이전 작품명");
  draft.page_plan[0].title = "이전 형식의 수정 문구";
  const restored = parseDemoDocumentSnapshot(
    JSON.stringify({ source, draft, assets, status: "editing", product }),
  );
  await setup(restored);
  expect(screen.getByText("이전 형식의 수정 문구")).toBeVisible();
  expect(productRequests).toBe(0);
});
