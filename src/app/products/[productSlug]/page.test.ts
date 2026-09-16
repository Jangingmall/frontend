import { beforeEach, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { fetchProductDetail } from "@/api/products/detail-api";
import { getProductDetailMock } from "@/api/products/mock/detail-fixtures";
import { ApiError } from "@/lib/http/api-error";

import { generateMetadata } from "./page";

vi.mock("@/api/products/detail-api", () => ({ fetchProductDetail: vi.fn() }));
vi.mock("./_components/ProductDetailPage", () => ({
  ProductDetailPage: () => null,
}));

beforeEach(() => {
  vi.mocked(fetchProductDetail).mockReset();
});

it.each([new ApiError(503, null), new ZodError([])])(
  "조회 오류 %s를 상품 없음 메타데이터로 바꾸지 않는다",
  async (error) => {
    vi.mocked(fetchProductDetail).mockRejectedValue(error);
    await expect(
      generateMetadata({
        params: Promise.resolve({ productSlug: "상품-101" }),
      }),
    ).rejects.toBe(error);
  },
);

it("조회 결과가 없을 때만 상품 없음 메타데이터를 반환한다", async () => {
  vi.mocked(fetchProductDetail).mockResolvedValue(null);
  await expect(
    generateMetadata({
      params: Promise.resolve({ productSlug: "없는-상품-999" }),
    }),
  ).resolves.toMatchObject({
    title: "상품을 찾을 수 없습니다 | 장인몰",
    robots: { index: false, follow: true },
  });
});

it.each([null, undefined])(
  "설명이 %s이면 상품명으로 메타데이터를 만든다",
  async (description) => {
    const product = getProductDetailMock(101)!;
    vi.mocked(fetchProductDetail).mockResolvedValue({
      ...product,
      description,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ productSlug: "백자-달항아리-101" }),
    });

    expect(metadata.description).toBe(product.name);
    expect(metadata.openGraph).toMatchObject({ description: product.name });
  },
);
