import { cache } from "react";

import { createQueryClient } from "./client";

/**
 * Server Component(RSC)에서 쓰는 요청 단위 QueryClient. `queryClient.prefetchQuery()` +
 * `dehydrate()` + `<HydrationBoundary>` 로 SSR에서 미리 채운 데이터를 클라이언트
 * QueryClient(`app/query-provider.tsx`) 캐시에 그대로 넘긴다.
 *
 * React의 `cache()`로 감싸 같은 요청 렌더 트리 안에서는 항상 같은 인스턴스를 반환한다.
 * `cache()`는 요청마다 초기화되므로(Next.js가 요청 경계에서 캐시를 리셋) 여러 요청이 이
 * 인스턴스를 공유할 걱정은 없다 — TanStack Query 공식 Next.js App Router 가이드와 동일한
 * 패턴이다.
 */
export const getQueryClient = cache(createQueryClient);
