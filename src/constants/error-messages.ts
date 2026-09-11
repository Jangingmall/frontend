/**
 * errorCode/status → 사용자 문구. (docs/data-layer.md §5.1)
 *
 * ⚠️ 아래 한글 문구는 전부 이 작업에서 FE가 임시로 지은 것이다. Figma·BE·노션 어디에도
 * 근거 문서가 없다 — `constants/badge.ts` 라벨(Figma 확정 카피)과는 성격이 다르다. 서비스
 * 톤·디자인이 확정되면 PM/디자인 검수 후 문자열 값만 통째로 교체한다. 코드 커버리지(모든
 * 알려진 errorCode·주요 status)는 지금 완결이고, 문구 자체의 톤·워딩은 리뷰 대상이 아니다.
 */
import type { KnownErrorCode } from "@/types/api";

/**
 * errorCode 전용 문구. BE `ErrorCode.java` 14종 + 추가 대기 `MISMATCH`.
 * `Record<KnownErrorCode, string>`이라 알려진 코드 유니온이 늘면 타입에러로 누락을 잡는다.
 */
const ERROR_MESSAGE_BY_CODE: Record<KnownErrorCode, string> = {
  INVALID_INPUT: "입력한 내용을 다시 확인해 주세요.",
  REQUEST_INVALID: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  REQUEST_BODY_MALFORMED:
    "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  UNAUTHORIZED: "로그인이 필요해요.",
  TOKEN_EXPIRED: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  TOKEN_MISMATCH: "로그인 정보가 유효하지 않아요. 다시 로그인해 주세요.",
  FORBIDDEN: "접근 권한이 없어요.",
  NOT_FOUND: "요청한 정보를 찾을 수 없어요.",
  CONFLICT: "이미 처리된 요청이거나 다른 곳에서 변경됐어요.",
  CONCURRENT_UPDATE:
    "다른 곳에서 먼저 변경됐어요. 새로고침 후 다시 시도해 주세요.",
  RESOURCE_EXPIRED: "유효 시간이 지났어요. 처음부터 다시 진행해 주세요.",
  BUSINESS_RULE_VIOLATION: "요청을 완료할 수 없어요.",
  TOO_MANY_REQUESTS: "요청이 많아요. 잠시 후 다시 시도해 주세요.",
  INTERNAL_ERROR: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  MISMATCH: "요청 정보가 일치하지 않아요. 다시 확인해 주세요.",
};

/** status fallback. `errorCode`가 없는 실패(일부 410·인프라 오류) 대비. */
const ERROR_MESSAGE_BY_STATUS: Record<number, string> = {
  400: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  401: "로그인이 필요해요.",
  403: "접근 권한이 없어요.",
  404: "요청한 정보를 찾을 수 없어요.",
  409: "이미 처리된 요청이거나 다른 곳에서 변경됐어요.",
  410: "유효 시간이 지났어요. 처음부터 다시 진행해 주세요.",
  429: "요청이 많아요. 잠시 후 다시 시도해 주세요.",
  500: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  502: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  503: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
};

/** 공통 기본 문구. `code`·`status` 어느 쪽으로도 안 걸리면 이걸로 떨어진다. */
export const GENERIC_ERROR_MESSAGE =
  "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

/**
 * 우선순위: `errorCode` 전용 문구 → `status` 문구 → `GENERIC_ERROR_MESSAGE`. (docs/data-layer.md §5.1)
 * 알려진 코드 유니온에 없는 `code`가 와도 항상 문자열을 반환한다(unknown-safe).
 */
export function resolveErrorMessage(
  code?: string | null,
  status?: number | null,
): string {
  if (code && code in ERROR_MESSAGE_BY_CODE) {
    return ERROR_MESSAGE_BY_CODE[code as KnownErrorCode];
  }
  if (status != null && status in ERROR_MESSAGE_BY_STATUS) {
    return ERROR_MESSAGE_BY_STATUS[status];
  }
  return GENERIC_ERROR_MESSAGE;
}
