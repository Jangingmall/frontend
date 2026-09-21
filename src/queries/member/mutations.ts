"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  changePassword,
  type ChangePasswordRequest,
  completeOAuthProfile,
  type CompleteOAuthProfileRequest,
  createAddress,
  deleteAddress,
  login,
  requestEmailVerification,
  signup,
  type SignupRequest,
  startMockOAuthLogin,
  updateAddress,
  updateMemberProfile,
  type UpdateMemberProfileRequest,
  updateSettings,
  verifyEmailCode,
  verifyPassword,
} from "@/api/member/api";
import type { OAuthProvider } from "@/types/auth";
import type { AddressInput, MemberSettings } from "@/types/member";

import { memberKeys } from "./keys";

/**
 * 로그인 mutation. `login()` api 함수 하나만 호출한다 — 로그인 응답에 `member`가 이미
 * 포함돼(경우 A, docs/routing-and-auth.md §9) `GET /me` 후속 호출이 필요 없다.
 *
 * `queries/`는 `stores`를 참조하지 않는다(docs/architecture.md §8.2 의존 표) — 세션을
 * store에 반영하는 건 이 훅을 호출하는 화면 조합 코드(로그인 폼)의 책임이다.
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      login(credentials),
  });
}

/** 이메일 인증 코드 발송 mutation. (design.md §0.1·§7-2 — placeholder 계약) */
export function useRequestEmailVerificationMutation() {
  return useMutation({
    mutationFn: (params: { email: string }) => requestEmailVerification(params),
  });
}

/** 이메일 인증 코드 확인 mutation. (design.md §0.1·§7-2 — placeholder 계약) */
export function useVerifyEmailCodeMutation() {
  return useMutation({
    mutationFn: (params: { email: string; code: string }) =>
      verifyEmailCode(params),
  });
}

/** 회원가입 mutation. 세션 반영은 화면 조합 코드(`SignupInfoForm`)의 책임이다(§0.2). */
export function useSignupMutation() {
  return useMutation({
    mutationFn: (body: SignupRequest) => signup(body),
  });
}

/**
 * 소셜 로그인 시작 mutation. `startMockOAuthLogin`은 목업 전용이라 실제 네트워크 호출이
 * 없지만, 화면 조합 코드는 `api` 계층을 직접 호출하지 않는다는 레이어 규칙은 네트워크 호출
 * 여부와 무관하게 적용된다 — 다른 placeholder 계약 함수들과 동일하게 mutation으로 감싼다.
 */
export function useStartOAuthLoginMutation() {
  return useMutation({
    mutationFn: (provider: OAuthProvider) => startMockOAuthLogin(provider),
  });
}

/** 소셜 추가정보 제출 mutation. 세션 반영은 화면 조합 코드의 책임이다. */
export function useCompleteOAuthProfileMutation() {
  return useMutation({
    mutationFn: (body: CompleteOAuthProfileRequest) =>
      completeOAuthProfile(body),
  });
}

/** 회원 정보(이름·휴대전화) 수정 mutation. 성공 시 프로필 쿼리를 무효화한다. */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMemberProfileRequest) => updateMemberProfile(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.profile() });
    },
  });
}

/** 비밀번호 변경 mutation. 응답 데이터가 없어 무효화할 캐시가 없다. */
export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePassword(body),
  });
}

/**
 * 비밀번호 재확인 mutation(회원정보 수정 진입 게이트). 검증 결과(boolean)만 반환하고
 * 캐시에 반영할 서버 상태가 없어 무효화하지 않는다.
 */
export function useVerifyPasswordMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      verifyPassword(email, password),
  });
}

/** 배송지 추가 mutation. 성공 시 배송지 목록을 무효화한다. */
export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.addresses() });
    },
  });
}

/**
 * 배송지 수정 mutation(부분 업데이트). "기본 배송지로 설정" 액션도 `{ isDefault: true }`만
 * 담아 이 mutation을 재사용한다.
 */
export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      addressId,
      input,
    }: {
      addressId: number;
      input: Partial<AddressInput>;
    }) => updateAddress(addressId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.addresses() });
    },
  });
}

/** 배송지 삭제 mutation. 성공 시 배송지 목록을 무효화한다. */
export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => deleteAddress(addressId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.addresses() });
    },
  });
}

/**
 * 설정 변경 mutation. 토글은 즉시성이 중요하고 실패 확률이 낮은 상호작용이라
 * 낙관적 업데이트를 적용한다(docs/data-layer.md §6.6) — `onMutate` 스냅샷 → `onError`
 * 롤백 → `onSettled` 무효화.
 */
export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();
  const queryKey = memberKeys.settings();
  return useMutation({
    mutationFn: (input: Partial<MemberSettings>) => updateSettings(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MemberSettings>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, { ...previous, ...input });
      }
      return { previous };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
