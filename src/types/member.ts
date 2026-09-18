import type { OAuthProvider, Role } from "./auth";

/**
 * 회원 로그인 방식. `"local"`은 이메일·비밀번호 가입, 그 외는 소셜 로그인 provider.
 * BE `MemberProfileResponse`엔 아직 이 값이 없다 — DB(`MemberSocialAccount`)엔 있으나
 * 응답에 노출되지 않아 필드 추가를 요청한 상태(docs 참고). 확정 전까지는 mock으로 가정한다.
 */
export type MemberAuthProvider = "local" | OAuthProvider;

/**
 * 마이페이지 전용 회원 상세 모델. `stores/auth`의 `AuthUser`(id/name/role)와 달리
 * email·phone·authProvider까지 포함한다 — 인증 판단에는 안 쓰이고 이 화면만 소비한다.
 */
export interface MemberProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  authProvider: MemberAuthProvider;
  role: Role;
}

/** 배송지. `GET|POST /api/member/me/addresses` 등이 다루는 FE 도메인 모델. */
export interface Address {
  id: number;
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
}

/** 배송지 생성·수정 입력. */
export interface AddressInput {
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
}
