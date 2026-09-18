/**
 * 휴대전화 통신사 접두사. 회원가입(`SignupInfoForm`)·배송지 폼(`AddressFormModal`)이
 * 공유한다 — 두 번째 사용처가 생겨 로컬 상수를 여기로 승격했다(docs/architecture.md
 * "공유 조각은 2번째 사용 시 승격" 원칙).
 */
export const PHONE_PREFIXES = [
  "010",
  "011",
  "016",
  "017",
  "018",
  "019",
] as const;

export type PhonePrefix = (typeof PHONE_PREFIXES)[number];

/**
 * BE가 하이픈 없이 주는 휴대전화(`01011112222`)를 접두사·중간·끝 4자리로 나눈다.
 *
 * 끝 4자리를 문자열 끝에서 고정으로 떼어내고 중간은 나머지 전부를 가져간다 — BE
 * `phone`은 `\d{9,20}`을 허용해 접두사 뒤가 7자리(끝 3+4가 아닌 4+3)인 10자리 전체
 * 번호도 유효하다. 이전엔 `slice(0,4)`/`slice(4,8)`로 무조건 4+4를 가정해, 그런
 * 기존 배송지를 수정 폼에 불러오면 전화번호를 안 건드려도 검증에 걸려 저장이 막혔다
 * (CodeRabbit 리뷰로 발견, 2026-09-18).
 */
export function splitPhone(phone: string): {
  phonePrefix: PhonePrefix;
  phoneMiddle: string;
  phoneLast: string;
} {
  const prefix = PHONE_PREFIXES.find((candidate) =>
    phone.startsWith(candidate),
  );
  const rest = prefix ? phone.slice(prefix.length) : phone.slice(3);
  return {
    phonePrefix: prefix ?? "010",
    phoneMiddle: rest.slice(0, -4),
    phoneLast: rest.slice(-4),
  };
}

/** 하이픈 없는 휴대전화를 `010-1111-2222` 표시용 형식으로 바꾼다(읽기 전용 화면용). */
export function formatPhone(phone: string): string {
  const { phonePrefix, phoneMiddle, phoneLast } = splitPhone(phone);
  return `${phonePrefix}-${phoneMiddle}-${phoneLast}`;
}
