"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputField } from "@/components/ui/input-field";
import { resolveErrorMessage } from "@/constants/error-messages";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { ApiError } from "@/lib/http/api-error";
import { useLoginMutation } from "@/queries/member/mutations";
import { useAuthStore } from "@/stores/auth";

import { KakaoLoginButton } from "./KakaoLoginButton";
import { NaverLoginButton } from "./NaverLoginButton";

/**
 * 「아이디 저장」 체크 시 이메일을 담아두는 localStorage 키. 순수 FE 로컬 기능이다 —
 * "로그인 유지"(리프레시 토큰 장기 보관)와는 다르다. BE `MemberLoginRequest`엔 그런 플래그가
 * 없고 refresh token TTL도 요청과 무관하게 고정 1주일이라(§4-5 인증 정책 계약서) "로그인
 * 유지" 체크박스는 이번 PR에서 만들지 않는다(디자인에도 없음).
 */
const REMEMBER_ID_KEY = "midam:rememberedEmail";

/**
 * `useSyncExternalStore`로 localStorage를 읽는다 — SSR에선 `getServerSnapshot`(null)로
 * 서버·최초 hydration 렌더를 맞추고, hydration 이후에만 실제 값으로 다시 그린다. `useEffect`
 * 안에서 `useState` setter를 직접 부르는 것보다(react-hooks/set-state-in-effect가 지적하는
 * cascading render) 이 쪽이 React가 권장하는, 외부 소스를 읽는 정석 경로다.
 */
function subscribeNever() {
  return () => {};
}
function getRememberedEmail() {
  return localStorage.getItem(REMEMBER_ID_KEY);
}
function getServerRememberedEmail() {
  return null;
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "아이디(이메일)를 입력해주세요.")
    .email("이메일 형식이 올바르지 않아요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** `/login?returnUrl=...`의 원본 값. 검증은 `safeReturnUrl`이 소비 시점에 한다. */
  returnUrl: string | null;
}

/**
 * 로그인 실패 문구. IA 확정 카피가 있는 케이스만 우선 매핑하고, 나머지는
 * `resolveErrorMessage` 공통 fallback을 쓴다 — 특히 429(`TOO_MANY_REQUESTS`)는 BE
 * `AuthRateLimiter`가 계정 단위 잠금이 아니라 IP+엔드포인트 범용 rate limit이라(로그인
 * 실패와 무관) "계정이 잠겼습니다" 같은 전용 문구를 따로 만들지 않는다.
 */
function mapLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "UNAUTHORIZED") {
      return "아이디 또는 비밀번호를 확인해주세요!";
    }
    return resolveErrorMessage(error.code, error.status);
  }
  return resolveErrorMessage();
}

export function LoginForm({ returnUrl }: LoginFormProps) {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const rememberedEmail = useSyncExternalStore(
    subscribeNever,
    getRememberedEmail,
    getServerRememberedEmail,
  );
  // 사용자가 체크박스를 직접 건드리기 전까진 저장된 이메일 유무를 그대로 따른다(파생값).
  // 건드린 뒤엔 그 선택을 우선한다 — effect로 상태를 동기화하지 않는다.
  const [rememberIdOverride, setRememberIdOverride] = useState<boolean | null>(
    null,
  );
  const rememberId = rememberIdOverride ?? rememberedEmail !== null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // 저장된 아이디를 필드에 prefill — RHF의 setValue는 useState setter가 아니라
  // set-state-in-effect 규칙 대상이 아니다(체크박스 쪽은 위 파생값으로 처리).
  useEffect(() => {
    if (rememberedEmail) setValue("email", rememberedEmail);
  }, [rememberedEmail, setValue]);

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const { accessToken, user } = await loginMutation.mutateAsync(values);
      // 로그인 응답에 member가 이미 포함돼 GET /me 후속 호출 없이 1콜로 끝난다.
      useAuthStore.getState().setSession(accessToken, user);
      if (rememberId) localStorage.setItem(REMEMBER_ID_KEY, values.email);
      else localStorage.removeItem(REMEMBER_ID_KEY);
      router.replace(safeReturnUrl(returnUrl) as Route);
    } catch (error) {
      setFormError(mapLoginError(error));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-4 py-16">
      <h1 className="text-center text-title-l text-font-dark">로그인</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <InputField
          label="아이디"
          type="email"
          placeholder="아이디(이메일)를 입력해주세요."
          error={errors.email?.message}
          clearable
          {...register("email")}
        />
        <InputField
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력해주세요."
          error={errors.password?.message}
          clearable
          {...register("password")}
        />

        {formError != null && (
          <p role="alert" className="text-body-s text-red-font">
            {formError}
          </p>
        )}

        <Checkbox checked={rememberId} onCheckedChange={setRememberIdOverride}>
          아이디 저장
        </Checkbox>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          loading={loginMutation.isPending}
        >
          로그인
        </Button>
      </form>

      {/* /find·/signup은 아직 라우트가 없다(LI-2·SU-1 — 로드맵 미편성·T-18). typedRoutes가
          모르는 경로라 (protected)/layout.tsx와 같은 방식으로 캐스팅한다. */}
      <div className="flex items-center justify-center gap-3 text-body-s text-font-dark-subtle">
        <Link href={"/find" as Route}>아이디 찾기</Link>
        <span aria-hidden>·</span>
        <Link href={"/find" as Route}>비밀번호 찾기</Link>
        <span aria-hidden>·</span>
        <Link href={"/signup" as Route}>회원가입</Link>
      </div>

      <div className="flex justify-center gap-4">
        <NaverLoginButton />
        <KakaoLoginButton />
      </div>
    </div>
  );
}
