import { http, HttpResponse } from "msw";

import { productCatalogue } from "@/api/products/mock/catalogue";
import { wishlistPageDto } from "@/api/wishlist/validation";
import { mockOk } from "@/mocks/envelope";

import { WISH_FIXTURES } from "./fixtures";

/** 찜 대상 productId를 카탈로그에서 찾아 찜 목록 항목 모양으로 바꾼다. */
function toWishItem(productId: number) {
  const product = productCatalogue.find((item) => item.id === productId);
  if (!product) return null;
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    thumbnail: [{ url: product.thumbnail.variants[1]?.url ?? "" }],
    status: product.status,
    rating: product.rating,
    artisanId: product.artisan.id,
    artisanName: product.artisan.name,
    primaryBadge: product.primaryBadge,
  };
}

export const wishlistHandlers = [
  http.get("*/api/member/me/wishes", ({ request }) => {
    const search = new URL(request.url).searchParams;
    const page = Math.max(0, Number(search.get("page")) || 0);
    const size = Math.min(100, Math.max(1, Number(search.get("size")) || 20));
    const offset = page * size;
    const content = WISH_FIXTURES.slice(offset, offset + size);
    const totalPages = Math.ceil(WISH_FIXTURES.length / size);
    return mockOk(
      wishlistPageDto.parse({
        content,
        totalElements: WISH_FIXTURES.length,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
      }),
    );
  }),

  /** 공통 응답 봉투를 안 쓰는 예외 엔드포인트 — 204/404만(`docs/api-contract.md` §5). */
  http.get("*/api/member/me/wishes/:productId", ({ params }) => {
    const productId = Number(params.productId);
    const wished = WISH_FIXTURES.some((item) => item.productId === productId);
    return new HttpResponse(null, { status: wished ? 204 : 404 });
  }),

  http.post("*/api/products/:productId/wish", ({ params }) => {
    const productId = Number(params.productId);
    if (!WISH_FIXTURES.some((item) => item.productId === productId)) {
      const item = toWishItem(productId);
      if (item) WISH_FIXTURES.unshift(item);
    }
    return mockOk(null, 201);
  }),

  http.delete("*/api/products/:productId/wish", ({ params }) => {
    const productId = Number(params.productId);
    const index = WISH_FIXTURES.findIndex(
      (item) => item.productId === productId,
    );
    if (index !== -1) WISH_FIXTURES.splice(index, 1);
    return mockOk(null);
  }),
];
