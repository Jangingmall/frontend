import { z } from "zod";

/**
 * 회원·인증 응답 검증 스키마. (docs/api-contract.md "회원·인증" · docs/routing-and-auth.md §4)
 *
 * 전부 `.passthrough()` — BE가 필드를 더 줘도 안 깨진다. 단 **인증 도메인은 prod에서도
 * `parse` throw**한다(docs/data-layer.md §4.3) — `safeParse` 분기를 두지 않는다.
 *
 * `POST /login` 응답엔 `member`(경우 A)가 이미 포함된다 — BE 레포(`Jangingmall/backend`)
 * `MemberLoginResponse`를 직접 대조해 확인. `GET /me`·로그인 응답의 `member`가 같은 모양이라
 * `memberProfileResponseDto` 하나로 공유한다. `POST /token/refresh`는 `member` 없이
 * `{ accessToken }`만 주므로(경우 B 그대로) `accessTokenResponseDto`를 그대로 쓴다.
 */

const roleSchema = z.enum(["USER", "ARTISAN", "ADMIN"]);

export const accessTokenResponseDto = z
  .object({ accessToken: z.string().min(1) })
  .passthrough();

export const memberProfileResponseDto = z
  .object({
    // ID는 Long 계약이라 정수만. (docs/api-contract.md §2.2)
    memberId: z.number().int(),
    email: z.string(),
    name: z.string(),
    // BE `Member.nickname`은 항상 채워지는 값이 아니고 `MemberSession`에 null로 넘기는
    // 생성자 오버로드가 있어 방어적으로 nullable 처리.
    nickname: z.string().nullable(),
    // 판매자는 "ARTISAN" 단일 값. 배열이 아니다. (docs/api-contract.md §3)
    role: roleSchema,
    profileImageUrl: z.string().nullable(),
  })
  .passthrough();

export const loginResponseDto = z
  .object({
    accessToken: z.string().min(1),
    member: memberProfileResponseDto,
  })
  .passthrough();

export type AccessTokenResponseDto = z.infer<typeof accessTokenResponseDto>;
export type MemberProfileResponseDto = z.infer<typeof memberProfileResponseDto>;
export type LoginResponseDto = z.infer<typeof loginResponseDto>;
