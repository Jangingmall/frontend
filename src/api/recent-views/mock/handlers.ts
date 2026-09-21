import { http } from "msw";

import { recentViewPageDto } from "@/api/recent-views/validation";
import { mockOk } from "@/mocks/envelope";

import { RECENT_VIEW_FIXTURES } from "./fixtures";

export const recentViewHandlers = [
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
