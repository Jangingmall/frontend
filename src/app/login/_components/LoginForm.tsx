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
 * 화면 레이아웃 출처: Figma `[삼성가고싶어요] GUI` 파일, 로그인 프레임 `889:61144`
 * (Figma MCP `get_design_context`로 2026-09-15 최종 확인). 실제 트리 중첩은:
 *
 *   Login Container (gap 64)
 *     "로그인"
 *     Social Login Buttons (gap 24)         ← 소셜 라벨+아이콘, 구분선, 입력 폼이 전부 여기 안
 *       Naver Login Button (gap 24) — "소셜 로그인" 라벨 + 아이콘 행(gap 64)
 *       Divider Container — "또는"
 *       Input Container → Input Field Container (gap 12)
 *         Input Fields (gap 0) — email·password·checkbox
 *         Options Container (justify-between)
 *     "로그인" 버튼
 *
 * 즉 64px 간격은 [제목 ↔ 아래 전체 블록]과 [전체 블록 ↔ 버튼] 딱 둘뿐이고, 그 블록 **안**은
 * 24px 리듬이다 — 이전엔 전부 64로 잘못 옮겨서 소셜~구분선~입력 폼 사이가 실제보다 훨씬
 * 벌어져 있었다.
 */

/**
 * 「아이디 저장」 체크 시 이메일을 담아두는 localStorage 키. 순수 FE 로컬 기능이다 —
 * "로그인 유지"(리프레시 토큰 장기 보관)와는 다르다. BE `MemberLoginRequest`엔 그런 플래그가
 * 없고 refresh token TTL도 요청과 무관하게 고정 1주일이라(§4-5 인증 정책 계약서) "로그인
 * 유지" 체크박스는 이번 PR에서 만들지 않는다(Figma에도 이 체크박스는 없음).
 */
const REMEMBER_ID_KEY = "midam:rememberedEmail";

/**
 * `InputField`의 라벨·헬퍼 슬롯을 Figma와 똑같이 "opacity-0로 안 보이지만 자리는 차지"하게
 * 만든다. Figma의 `label 1`/`label 2`가 정확히 이 방식이다(`opacity: 0`, 레이아웃엔 그대로
 * 반영) — 시각 라벨이 안 보이는 건 맞지만 그 22px 자리는 실제로 비워 두는 게 디자인 의도였다.
 * `opacity-0`는 (`display:none`과 달리) 스크린리더 접근성 트리에서 제거되지 않으므로, 이
 * 텍스트가 `Field.Label`의 기본 `aria`/`for` 연결을 통해 그대로 접근성 이름 역할도 한다 —
 * 별도 `aria-label`이 필요 없다.
 */
function invisibleLabel(text: string) {
  return <span className="opacity-0">{text}</span>;
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
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

export function LoginForm({ returnUrl }: LoginFormProps) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
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

  // 이미 인증된 사용자가 /login에 직접 접근(북마크·뒤로가기·URL 직접 입력)한 경우 밖으로
  // 내보낸다. `(protected)/layout.tsx`(§5.1)의 반대 방향 가드 — 이쪽은 `docs/routing-and-
  // auth.md` §5.3 표에 빠져 있던 케이스라 사용자 확인 후 이번에 추가했다. `/mypage`가 아직
  // 라우트가 없어(T-20+ 미착수) fallback을 로그인 성공 시(`onSubmit`, "/mypage" 기본값)와
  // 다르게 "/"로 명시한다 — 그대로 두면 404로 보낸다.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(safeReturnUrl(returnUrl, "/") as Route);
    }
  }, [status, returnUrl, router]);

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const { accessToken, user } = await loginMutation.mutateAsync(values);
      // 로그인 응답에 member가 이미 포함돼 GET /me 후속 호출 없이 1콜로 끝난다.
      useAuthStore.getState().setSession(accessToken, user);
      if (rememberId) localStorage.setItem(REMEMBER_ID_KEY, values.email);
      else localStorage.removeItem(REMEMBER_ID_KEY);
      // fallback을 "/"로 명시한다 — 문서 기본값 "/mypage"는 아직 라우트가 없다(T-20+
      // 미착수). §5.6의 "이미 인증된 사용자" 가드에선 이미 이렇게 고쳤는데 정작 로그인
      // 성공 경로 자체는 빠뜨렸었다(Codex 리뷰 F1, review.md).
      router.replace(safeReturnUrl(returnUrl, "/") as Route);
    } catch (error) {
      setFormError(mapLoginError(error));
    }
  }

  // `loading`(부팅 silent refresh 확정 전)·`authenticated`(위 effect가 곧 내보냄) 둘 다 폼을
  // 보여주지 않는다 — `(protected)/layout.tsx`와 동일한 최소 접근성 fallback을 그대로 쓴다.
  if (status !== "anonymous") {
    return (
      <output
        aria-live="polite"
        className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500"
      >
        불러오는 중…
      </output>
    );
  }

  return (
    // 상하 비대칭: 위(GNB↔제목)는 Figma 주석대로 64px(pt-16)이지만, 아래(버튼↔Footer)는
    // Login Container 내부 리듬(64)과 무관하게 프레임에 별도로 「여백 200px」이 명시돼 있다
    // (pb-50 = 50 × 0.25rem = 12.5rem = 200px, Tailwind v4 동적 spacing 스케일).
    <div className="mx-auto flex w-full max-w-[27rem] flex-col items-center gap-16 px-4 pt-16 pb-50">
      <h1 className="text-center text-title-xl text-font-dark">로그인</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex w-full flex-col items-center gap-16"
      >
        {/* Social Login Buttons — 소셜 라벨·아이콘·구분선·입력 폼을 전부 담는 24px 리듬 블록 */}
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-6">
            <p className="text-center text-body-s-b text-font-dark-secondary">
              소셜 로그인
            </p>
            <div className="flex gap-16">
              <NaverLoginButton />
              <KakaoLoginButton />
            </div>
          </div>

          <div className="flex w-full items-center gap-1">
            <hr className="h-px flex-1 border-0 bg-border-jade-weak" />
            <span className="text-caption-b text-font-dark-secondary">
              또는
            </span>
            <hr className="h-px flex-1 border-0 bg-border-jade-weak" />
          </div>

          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-col">
              <InputField
                label={invisibleLabel("이메일")}
                helperText={errors.email ? undefined : invisibleLabel("-")}
                type="email"
                placeholder="이메일을 입력해주세요."
                error={errors.email?.message}
                clearable
                className="rounded-none border-0 border-b border-(--textfield-border)"
                {...register("email")}
              />
              <InputField
                label={invisibleLabel("비밀번호")}
                helperText={errors.password ? undefined : invisibleLabel("-")}
                type="password"
                placeholder="비밀번호를 입력해주세요."
                error={errors.password?.message}
                clearable
                className="rounded-none border-0 border-b border-(--textfield-border)"
                {...register("password")}
              />
              <div className="px-2 py-0.5">
                <Checkbox
                  checked={rememberId}
                  onCheckedChange={setRememberIdOverride}
                >
                  아이디 저장
                </Checkbox>
              </div>
            </div>

            {formError != null && (
              <p role="alert" className="text-body-s text-red-font">
                {formError}
              </p>
            )}

            {/* /find·/signup은 아직 라우트가 없다(LI-2·SU-1 — 로드맵 미편성·T-18). typedRoutes가
                모르는 경로라 (protected)/layout.tsx와 같은 방식으로 캐스팅한다. */}
            <div className="flex items-center justify-between">
              <div className="flex">
                <Link
                  href={"/find" as Route}
                  className="flex min-w-[4.5rem] items-center justify-center px-2 py-1 text-body-s text-font-dark"
                >
                  아이디 찾기
                </Link>
                <Link
                  href={"/find" as Route}
                  className="flex min-w-[4.5rem] items-center justify-center px-2 py-1 text-body-s text-font-dark"
                >
                  비밀번호 찾기
                </Link>
              </div>
              {/* Figma: 회원가입만 Bold, 나머지 둘은 Regular */}
              <Link
                href={"/signup" as Route}
                className="flex min-w-[4.5rem] items-center justify-center px-2 py-1 text-body-s-b text-font-dark"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="xl"
          className="w-full"
          loading={loginMutation.isPending}
        >
          로그인
        </Button>
      </form>
    </div>
  );
}
