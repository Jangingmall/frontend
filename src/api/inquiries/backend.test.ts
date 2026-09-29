import { expect, it, vi } from "vitest";

import { createInquiry, fetchInquiries } from "./api";
vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: false } }));
it.each([true, false])(
  "API 모드에서는 isMock=%s여도 문의 읽기와 쓰기를 차단한다",
  async (isMock) => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(fetchInquiries(101, false, isMock, true)).rejects.toThrow(
      "일시 중단",
    );
    await expect(
      createInquiry(
        101,
        {
          type: "상품 상세문의",
          title: "문의",
          body: "제작 기간",
          isSecret: false,
        },
        isMock,
      ),
    ).rejects.toThrow("일시 중단");
    expect(spy).not.toHaveBeenCalled();
  },
);
