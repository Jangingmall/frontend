import { productHandlers } from "@/api/products/mock/handlers";

/**
 * 전 도메인 MSW 핸들러 집계 지점. `browser`(worker)·`server`(node)·테스트가 이 배열을
 * 공유한다. 도메인 핸들러는 각 `api/{domain}/mock/handlers.ts`에 두고 여기서 spread로
 * 등록한다. (docs/testing.md §2)
 */
export const handlers = [...productHandlers];
