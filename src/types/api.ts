/**
 * 공통 API 응답 봉투와 횡단 타입. (docs/api-contract.md §2)
 * 도메인 모델은 각 `api/{domain}/`, 여러 역할이 공유하는 원시 타입만 여기 둔다.
 */

/** 성공 응답. 본문 없는 응답은 `data`가 `null`. */
export interface ApiResponse<T> {
  success: true;
  status: number;
  data: T;
}

/** 실패 응답. `errorCode`는 문자열 그대로 보관하고, 알려진 값은 {@link KnownErrorCode}. */
export interface ApiErrorResponse {
  success: false;
  status: number;
  errorCode: string;
  /** 개발·로깅용. 일부 응답에만 존재. 사용자 문구는 FE가 소유한다. */
  message?: string;
}

/**
 * BE 목록 응답 원형. 페이지네이션 파라미터·응답 필드는 BE 확정 대기라
 * 확정된 두 필드만 명시하고, 나머지는 스키마 `.passthrough()`로 흡수한다.
 * 화면·쿼리가 쓰는 형태는 {@link Page}.
 */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

/** FE 정규화 페이지 모델. 번호 페이지네이션 기준. */
export interface Page<T> {
  items: T[];
  /** 1-base */
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * BE `ErrorCode` enum 미러 + 추가 예정 코드. (docs/api-contract.md §2.3)
 * 타입 힌트·문구 매핑 참고용이며, 이 목록에 없는 코드가 와도 fetcher·화면이
 * 깨지지 않아야 한다. 소비측은 항상 `string`으로 받고 이 유니온으로 좁힌다.
 */
export const KNOWN_ERROR_CODES = [
  "INVALID_INPUT",
  "REQUEST_INVALID",
  "REQUEST_BODY_MALFORMED",
  "UNAUTHORIZED",
  "TOKEN_EXPIRED",
  "TOKEN_MISMATCH",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "CONCURRENT_UPDATE",
  "RESOURCE_EXPIRED",
  "BUSINESS_RULE_VIOLATION",
  "TOO_MANY_REQUESTS",
  "INTERNAL_ERROR",
  // BE `ErrorCode.java` 반영 대기 — 결제 승인 등에서 사용
  "MISMATCH",
] as const;

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

/** 임의 문자열이 알려진 errorCode인지 좁힌다. */
export function isKnownErrorCode(code: string): code is KnownErrorCode {
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code);
}
