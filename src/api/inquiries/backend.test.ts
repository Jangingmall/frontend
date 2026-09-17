import { http } from "msw";
import { expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { createInquiry, fetchInquiries } from "./api";

const input = {
  type: "상품 상세문의" as const,
  title: "",
  body: "제작 기간 문의",
  isSecret: false,
};

it("posts only current content/secret fields with authentication", async () => {
  useAuthStore
    .getState()
    .setSession("mock-access-token", { id: 1, name: "구매자", role: "USER" });
  server.use(
    http.post("*/api/products/101/questions", async ({ request }) => {
      expect(await request.json()).toEqual({
        content: "제작 기간 문의",
        secret: false,
      });
      expect(request.headers.get("authorization")).toBe(
        "Bearer mock-access-token",
      );
      return mockOk({
        questionId: 1,
        productId: 101,
        writerId: 1,
        content: "제작 기간 문의",
        secret: false,
        createdAt: "2026-09-17T10:00:00",
        answer: null,
      });
    }),
  );
  expect(await createInquiry(101, input, false)).toMatchObject({
    id: 1,
    body: input.body,
    isSecret: false,
    status: "WAITING",
  });
});

it("rejects over-limit content and defers secret writes and unsafe list reads before fetch", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  await expect(
    createInquiry(101, { ...input, body: "가".repeat(1001) }, false),
  ).rejects.toThrow();
  await expect(
    createInquiry(101, { ...input, isSecret: true }, false),
  ).rejects.toThrow();
  await expect(fetchInquiries(101, true, false, true)).rejects.toThrow();
  expect(fetchSpy).not.toHaveBeenCalled();
});
