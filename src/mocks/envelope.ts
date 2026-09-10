import { HttpResponse } from "msw";

import type { ApiErrorResponse, ApiResponse, PagedResponse } from "@/types/api";

/**
 * MSW 도메인 핸들러가 공유하는 공통 응답 봉투 빌더. (docs/api-contract.md §2.1)
 * `HttpResponse` 의존은 이 파일에만 둔다. 봉투 형태의 단일 정의를 강제해
 * 도메인마다 손으로 `{ success, status, data }`를 쓰다 어긋나는 것을 막는다.
 */

/** 성공 봉투. 본문 없는 응답은 `data`에 `null`을 넘긴다. */
export function mockOk<T>(data: T, status = 200) {
  return HttpResponse.json<ApiResponse<T>>(
    { success: true, status, data },
    { status },
  );
}

/**
 * 목록 성공 봉투. `page`/`size`/`totalPages` 등은 BE 확정 대기라
 * 확정된 `items`+`totalCount`만 싣는다. (docs/api-contract.md §2.4)
 */
export function mockPaged<T>(
  items: T[],
  totalCount = items.length,
  status = 200,
) {
  return mockOk<PagedResponse<T>>({ items, totalCount }, status);
}

/**
 * 실패 봉투. `errorCode`는 문자열 그대로 싣는다 — 알려진 유니온에 없는 코드도
 * 그대로 통과시켜 소비측(fetcher·화면)의 unknown-safe 처리를 검증할 수 있게 한다.
 * (docs/api-contract.md §2.3)
 */
export function mockError(status: number, errorCode: string, message?: string) {
  return HttpResponse.json<ApiErrorResponse>(
    { success: false, status, errorCode, ...(message ? { message } : {}) },
    { status },
  );
}
