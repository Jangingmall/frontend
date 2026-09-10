import { http } from "msw";
import { describe, expect, it } from "vitest";

import { fetchProductList } from "@/api/products/api";
import { ApiError } from "@/lib/http/api-error";

import { mockError } from "./envelope";
import { server } from "./server";

/**
 * 목업 배선이 실제로 물리는지 한 경로로 증명한다:
 * 공개 조회 → MSW 핸들러 → 응답 봉투 해제 → Zod 검증 → 매퍼 → FE 모델.
 * 도메인별 세부 검증은 각 슬라이스의 테스트가 담당하고, 여기서는 파이프라인 자체만 본다.
 */
describe("mock pipeline", () => {
  it("resolves a public list request through handler → validation → mapper", async () => {
    const page = await fetchProductList();

    expect(page).toMatchObject({ page: 1, pageSize: 20, totalCount: 3 });
    expect(page.items).toHaveLength(3);
    expect(page.items[0]).toMatchObject({ id: 101, isSoldOut: false });
  });

  it("returns an empty page past the seeded boundary", async () => {
    const page = await fetchProductList({ page: 2 });

    expect(page.items).toEqual([]);
    expect(page).toMatchObject({ page: 2, totalCount: 0, totalPages: 1 });
  });

  it("surfaces a failure envelope as ApiError with the errorCode preserved", async () => {
    server.use(
      http.get("*/api/products", () =>
        mockError(500, "INTERNAL_ERROR", "boom"),
      ),
    );

    await expect(fetchProductList()).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      code: "INTERNAL_ERROR",
    });
    await expect(fetchProductList()).rejects.toBeInstanceOf(ApiError);
  });
});
