import { beforeEach, expect, it, vi } from "vitest";

import { fetchProductDetail } from "@/api/products/detail-api";
import { getProductDetailMock } from "@/api/products/mock/detail-fixtures";

import { generateMetadata } from "./page";

vi.mock("@/api/products/detail-api", () => ({ fetchProductDetail: vi.fn() }));
vi.mock("./_components/ProductDetailPage", () => ({
  ProductDetailPage: () => null,
}));

beforeEach(() => vi.mocked(fetchProductDetail).mockReset());

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
