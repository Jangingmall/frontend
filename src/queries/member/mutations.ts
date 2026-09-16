"use client";

import { useMutation } from "@tanstack/react-query";

import {
  login,
  requestEmailVerification,
  signup,
  type SignupRequest,
  verifyEmailCode,
} from "@/api/member/api";

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
