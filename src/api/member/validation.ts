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

/**
 * `POST /api/member/email-verifications` 응답. **placeholder 계약**(design.md §0.1·§7-2) —
 * 실제 BE는 지금 이메일 인증 코드 API가 없고(재전송 전용 + magic-link 방식) 코드 입력 방식으로
 * 바꿀 예정이라고만 전달받았다. BE가 실제로 배포하면 이 스키마를 다시 대조해야 한다.
 */
export const emailVerificationResponseDto = z
  .object({ expiresInSeconds: z.number().int().positive() })
  .passthrough();

/**
 * `POST /api/member/signup` 응답. **BE에 변경을 요청한 형태**(design.md §0.2) — 로그인과
 * 동일하게 세션(`accessToken`+`member`)을 받는다고 가정한다. 실제로 지금 BE가 주는 건
 * `{ memberId, email, status }`뿐이라(세션 없음) BE가 이 변경을 배포하기 전엔 실제 서버로
 * 가입할 때마다 이 스키마의 `parse`가 실패한다 — 알고 진행하는 배포 순서 리스크.
 */
export const signupResponseDto = loginResponseDto;

export type EmailVerificationResponseDto = z.infer<
  typeof emailVerificationResponseDto
>;
export type SignupResponseDto = z.infer<typeof signupResponseDto>;
