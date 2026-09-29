import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";

import { server } from "@/mocks/server";

import { createInquiry, fetchInquiries } from "./api";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
const question = {
  questionId: 1,
  productId: 101,
  writerId: 9,
  content: "제작 기간은 얼마나 걸리나요?",
  secret: false,
  createdAt: "2026-09-29T10:00:00",
  answer: null,
};
it("비밀 답변을 보호할 수 없는 실제 문의 목록은 연결하지 않는다", async () => {
  const spy = vi.spyOn(globalThis, "fetch");
  await expect(fetchInquiries(101, false, false, false)).rejects.toThrow(
    "일시 중단",
  );
  expect(spy).not.toHaveBeenCalled();
});
it.each([true, false])(
  "공개 문의를 실제 content/secret 계약으로 등록한다 (mock=%s)",
  async (isMock) => {
    let body: unknown;
    server.use(
      http.post("*/api/products/101/questions", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { success: true, data: question },
          { status: 201 },
        );
      }),
    );
    await expect(
      createInquiry(
        101,
        {
          type: "상품 상세문의",
          title: "",
          body: question.content,
          isSecret: false,
        },
        isMock,
      ),
    ).resolves.toMatchObject({ id: 1, body: question.content });
    expect(body).toEqual({ content: question.content, secret: false });
  },
);
it("다른 상품의 등록 응답을 성공으로 처리하지 않는다", async () => {
  server.use(
    http.post("*/api/products/101/questions", () =>
      HttpResponse.json(
        { success: true, data: { ...question, productId: 102 } },
        { status: 201 },
      ),
    ),
  );
  await expect(
    createInquiry(
      101,
      {
        type: "상품 상세문의",
        title: "",
        body: question.content,
        isSecret: false,
      },
      false,
    ),
  ).rejects.toThrow();
});
it("1000자 초과와 비밀 문의 등록은 네트워크 전에 거부한다", async () => {
  const spy = vi.spyOn(globalThis, "fetch");
  for (const input of [
    { body: "가".repeat(1001), isSecret: false },
    { body: "문의", isSecret: true },
  ])
    await expect(
      createInquiry(101, { type: "상품 상세문의", title: "", ...input }, false),
    ).rejects.toThrow();
  expect(spy).not.toHaveBeenCalled();
});
