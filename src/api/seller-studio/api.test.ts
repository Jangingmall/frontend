import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import {
  changeContentStatus,
  getContent,
  getGeneration,
  listSellerProducts,
  saveContent,
  startGeneration,
} from "./api";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it("생성에 업로드된 이미지 ID를 보내고 비동기 작업 ID를 받는다", async () => {
  server.use(
    http.post("*/api/content/products/12/generations", async ({ request }) => {
      expect(await request.json()).toEqual({
        images: ["img-1"],
        productName: "찻잔",
        howMade: "제작",
        careTips: "관리",
      });
      return mockOk({ productId: 12, generationId: 7, status: "QUEUED" }, 202);
    }),
  );
  expect(
    await startGeneration(12, {
      images: ["img-1"],
      productName: "찻잔",
      howMade: "제작",
      careTips: "관리",
    }),
  ).toMatchObject({ generationId: 7, status: "QUEUED" });
});
it.each([
  "QUEUED",
  "PROCESSING",
  "ANALYZING",
  "DRAFT_READY",
  "COMPLETED",
  "FAILED",
])("생성 상태 %s를 그대로 처리한다", async (status) => {
  server.use(
    http.get("*/api/content/products/12/generations/7", () =>
      mockOk({ productId: 12, generationId: 7, status }),
    ),
  );
  expect((await getGeneration(12, 7)).status).toBe(status);
});
it("서버 문서가 없거나 잘못되면 가짜 초안을 만들지 않는다", async () => {
  server.use(
    http.get("*/api/content/products/12/contents", () =>
      mockError(404, "NOT_FOUND"),
    ),
  );
  await expect(getContent(12)).rejects.toMatchObject({ status: 404 });
  server.use(
    http.get("*/api/content/products/12/contents", () =>
      mockOk({
        contentId: 1,
        productId: 12,
        status: "DRAFT",
        version: 1,
        reactDocument: null,
      }),
    ),
  );
  await expect(getContent(12)).rejects.toThrow();
});
it("수정은 patches로 보내며 실패를 성공으로 바꾸지 않는다", async () => {
  server.use(
    http.patch("*/api/content/products/12/contents/3", async ({ request }) => {
      expect(await request.json()).toEqual({
        patches: [{ nodeId: "text", text: "변경" }],
      });
      return mockError(500, "INTERNAL_ERROR");
    }),
  );
  await expect(
    saveContent(12, 3, [{ nodeId: "text", text: "변경" }]),
  ).rejects.toMatchObject({ status: 500 });
});
it("검수 승인 Boolean과 게시 경로를 구분한다", async () => {
  const approval = {
    factCheckConfirmed: true,
    photoMatchConfirmed: true,
    displayApprovalBadge: false,
  };
  server.use(
    http.post(
      "*/api/content/products/12/contents/3/approve",
      async ({ request }) => {
        expect(await request.json()).toEqual(approval);
        return mockOk({ contentId: 3, status: "APPROVED" });
      },
    ),
    http.post("*/api/content/products/12/publish", () =>
      mockOk({ contentId: 3, status: "PUBLISHED" }),
    ),
  );
  expect((await changeContentStatus(12, 3, "approve", approval)).status).toBe(
    "APPROVED",
  );
  expect((await changeContentStatus(12, 3, "publish")).status).toBe(
    "PUBLISHED",
  );
});
it("내 상품의 Spring Page 응답을 읽는다", async () => {
  server.use(
    http.get("*/api/products/me", ({ request }) => {
      expect(new URL(request.url).searchParams.get("page")).toBe("2");
      return mockOk({ content: [], totalElements: 40, totalPages: 2 });
    }),
  );
  expect((await listSellerProducts(2)).totalElements).toBe(40);
});
