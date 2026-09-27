import { http } from "msw";
import { z } from "zod";

import { productCatalogue } from "@/api/products/mock/catalogue";
import { recentViewPageDto } from "@/api/recent-views/validation";
import { mockError } from "@/mocks/envelope";
import { mockOk } from "@/mocks/envelope";

import { RECENT_VIEW_FIXTURES } from "./fixtures";

export const recentViewHandlers = [
  http.post(
    "*/api/member/recent-views",
    async ({ request }): Promise<Response> => {
      const parsed = z
        .object({ productId: z.number().int().positive() })
        .safeParse(await request.json());
      if (!parsed.success) return mockError(400, "INVALID_INPUT");
      const product = productCatalogue.find(
        (item) => item.id === parsed.data.productId,
      );
      if (!product) return mockError(404, "NOT_FOUND");
      const index = RECENT_VIEW_FIXTURES.findIndex(
        (item) => item.productId === product.id,
      );
      if (index >= 0) RECENT_VIEW_FIXTURES.splice(index, 1);
      RECENT_VIEW_FIXTURES.unshift({
        productId: product.id,
        name: product.name,
        price: product.price,
        thumbnail: product.thumbnail.variants,
        status: product.status,
        rating: product.rating,
        artisanId: product.artisan.id,
        artisanName: product.artisan.name,
        primaryBadge: null,
        viewedAt: new Date().toISOString(),
      });
      return mockOk(null);
    },
  ),
  http.get("*/api/member/recent-views", ({ request }) => {
    const search = new URL(request.url).searchParams;
    const page = Math.max(0, Number(search.get("page")) || 0);
    const size = Math.min(100, Math.max(1, Number(search.get("size")) || 20));
    const offset = page * size;
    const content = RECENT_VIEW_FIXTURES.slice(offset, offset + size);
    const totalPages = Math.ceil(RECENT_VIEW_FIXTURES.length / size);
    return mockOk(
      recentViewPageDto.parse({
        content,
        totalElements: RECENT_VIEW_FIXTURES.length,
        totalPages,
        size,
        number: page,
        first: page === 0,
        last: page >= totalPages - 1,
        empty: content.length === 0,
      }),
    );
  }),

  http.delete("*/api/member/recent-views", () => {
    RECENT_VIEW_FIXTURES.length = 0;
    return mockOk(null);
  }),
];
