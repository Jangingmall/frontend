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

/** BE가 하이픈 없이 주는 휴대전화(`01011112222`)를 접두사·중간·끝 4자리로 나눈다. */
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
    phoneMiddle: rest.slice(0, 4),
    phoneLast: rest.slice(4, 8),
  };
}

/** 하이픈 없는 휴대전화를 `010-1111-2222` 표시용 형식으로 바꾼다(읽기 전용 화면용). */
export function formatPhone(phone: string): string {
  const { phonePrefix, phoneMiddle, phoneLast } = splitPhone(phone);
  return `${phonePrefix}-${phoneMiddle}-${phoneLast}`;
}
