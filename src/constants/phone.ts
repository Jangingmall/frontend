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
