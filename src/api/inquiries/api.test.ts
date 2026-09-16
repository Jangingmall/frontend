import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/mocks/server";
import { useAuthStore } from "@/stores/auth";

import { createInquiry, fetchInquiries } from "./api";
import { inquiryHandlers, resetInquiryMock } from "./mock/handlers";

describe("상품 문의 응답 보안", () => {
  beforeEach(() => {
    server.use(...inquiryHandlers);
    resetInquiryMock();
    useAuthStore.getState().clear();
  });
  it("실제 환경에서는 미확정 조회·등록 요청을 보내지 않는다", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(fetchInquiries(101, false, false, false)).rejects.toThrow(
      "준비 중",
    );
    await expect(
      createInquiry(
        101,
        { type: "배송", title: "", body: "문의", isSecret: false },
        false,
      ),
    ).rejects.toThrow("준비 중");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("공개 응답 자체에서 다른 사람의 비밀 제목·본문·답변을 제거한다", async () => {
    const response = await fetch(
      "http://localhost:3000/api/mock/products/101/inquiries",
    );
    const { data } = await response.json();
    const secret = data.items.find(
      (item: { isSecret: boolean }) => item.isSecret,
    );
    expect(secret).toMatchObject({
      title: "비밀글입니다.",
      body: null,
      reply: null,
      canRead: false,
    });
    expect(JSON.stringify(data)).not.toContain("비공개 배송지");
    expect(JSON.stringify(data)).not.toContain("비공개 답변");
  });
  it("본인 문의만 읽고 다른 회원 문의는 보호하며 비밀글을 제외한다", async () => {
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "김미담",
      role: "USER",
    });
    const data = await fetchInquiries(101, false, true, true);
    expect(data.items.find((item) => item.id === 3)).toMatchObject({
      canRead: true,
      body: "비공개 배송지 문의입니다.",
    });
    expect(data.items.find((item) => item.id === 4)).toMatchObject({
      canRead: false,
      body: null,
      reply: null,
    });
    expect(
      (await fetchInquiries(101, true, true, true)).items.every(
        (item) => !item.isSecret,
      ),
    ).toBe(true);
  });
  it("작성 결과를 후속 목록과 개수에 반영한다", async () => {
    useAuthStore.getState().setSession("mock-access-token", {
      id: 1,
      name: "김미담",
      role: "USER",
    });
    const before = await fetchInquiries(101, false, true, true);
    await createInquiry(
      101,
      { type: "기타", title: "새 문의", body: "문의합니다.", isSecret: true },
      true,
    );
    const after = await fetchInquiries(101, false, true, true);
    expect(after.totalCount).toBe(before.totalCount + 1);
    expect(after.items[0]).toMatchObject({
      title: "새 문의",
      body: "문의합니다.",
      isSecret: true,
    });
  });
});
