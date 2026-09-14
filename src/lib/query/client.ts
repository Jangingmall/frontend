import { QueryClient } from "@tanstack/react-query";

/**
 * 클라이언트·서버 공용 QueryClient 팩토리. 클라이언트에선 `app/query-provider.tsx`가
 * 브라우저 세션 동안 하나만 만들어 재사용하고, 서버에선 `lib/query/server.ts`가 요청마다
 * 새로 만든다 — 어느 쪽이든 기본 옵션(재시도 1회)은 이 한 곳에서만 정의한다.
 */
export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
}
