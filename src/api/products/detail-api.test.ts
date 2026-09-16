import { http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";

import { fetchProductDetail } from "./detail-api";
import {
  getProductDetailMock,
  getProductDetailMockDto,
} from "./mock/detail-fixtures";

vi.mock("@/lib/env", () => ({ publicEnv: { apiMocking: true } }));

describe("공개 상세 조회", () => {
  it("MSW 서버의 상세를 검증하고 같은 목록 상품으로 변환한다", async () => {
    const result = await fetchProductDetail(101);
    expect(result).toMatchObject({
      id: 101,
      name: "백자 달항아리",
      price: 20000,
      isMock: true,
    });
    expect(result?.images).toHaveLength(6);
    expect(result?.optionGroups).toHaveLength(3);
    expect(result?.relatedProducts).toHaveLength(3);
  });

  it("404만 빈 결과로 변환하고 서버 오류는 재시도 경계로 올린다", async () => {
    expect(await fetchProductDetail(999)).toBeNull();
    await expect(fetchProductDetail(997)).rejects.toMatchObject({
      status: 503,
    });
  });

  it("서버가 비공개 상태를 보내더라도 페이지에 노출하지 않는다", async () => {
    const fixture = getProductDetailMockDto(101)!;
    server.use(
      http.get("*/api/products/101", () =>
        mockOk({ ...fixture, status: "DRAFT" }),
      ),
    );
    expect(await fetchProductDetail(101)).toBeNull();
  });

  it("품절·옵션 없음·3개 필수·재고 누락을 구분한다", () => {
    expect(getProductDetailMock(102)?.optionGroups).toEqual([]);
    expect(getProductDetailMock(103)).toMatchObject({
      status: "SOLD_OUT",
      stock: 0,
    });
    expect(
      getProductDetailMock(104)?.optionGroups.filter((group) => group.required),
    ).toHaveLength(3);
    expect(getProductDetailMock(106)).toMatchObject({
      status: "ON_SALE",
      stock: null,
      artisan: null,
      images: [],
    });
  });
});
