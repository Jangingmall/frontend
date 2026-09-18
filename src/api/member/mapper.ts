import type { AuthUser } from "@/types/auth";
import type {
  Address,
  MemberAuthProvider,
  MemberProfile,
} from "@/types/member";

import type {
  AddressResponseDto,
  MemberProfileResponseDto,
} from "./validation";

/**
 * `GET /api/member/me` DTO(그리고 로그인 응답의 `member` 필드 — 같은 모양) → FE 도메인 모델.
 * `memberId` → `id`로 이름을 맞추고 화면이 실제로 쓰는 `id`·`name`·`role`만 남긴다
 * (`email`·`nickname`·`profileImageUrl`은 아직 소비하는 화면이 없다 — docs/architecture.md
 * "실제 소비하는 슬라이스만 선언" 원칙).
 */
export function mapMemberProfile(dto: MemberProfileResponseDto): AuthUser {
  return { id: dto.memberId, name: dto.name, role: dto.role };
}

function mapAuthProvider(
  authProvider: MemberProfileResponseDto["authProvider"],
): MemberAuthProvider {
  switch (authProvider) {
    case "NAVER":
      return "naver";
    case "KAKAO":
      return "kakao";
    default:
      return "local";
  }
}

/**
 * `GET /api/member/me` DTO → 마이페이지 전용 상세 모델. `mapMemberProfile`과 같은 응답을
 * 다른 목적(회원정보 조회·수정 화면)으로 매핑한다 — email·phone·authProvider까지 필요해서
 * 별도 함수로 둔다(auth store용 `AuthUser`는 그대로 최소 모델 유지).
 */
export function mapMemberDetail(dto: MemberProfileResponseDto): MemberProfile {
  return {
    id: dto.memberId,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    authProvider: mapAuthProvider(dto.authProvider),
    role: dto.role,
  };
}

/** 배송지 DTO → FE 도메인 모델. `addressId` → `id`로 이름만 맞춘다. */
export function mapAddress(dto: AddressResponseDto): Address {
  return {
    id: dto.addressId,
    recipientName: dto.recipientName,
    phone: dto.phone,
    zipCode: dto.zipCode,
    address1: dto.address1,
    address2: dto.address2,
    isDefault: dto.isDefault,
  };
}
