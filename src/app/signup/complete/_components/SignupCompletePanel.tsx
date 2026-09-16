"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SignupStepIndicator } from "@/app/signup/_components/SignupStepIndicator";
import { Button } from "@/components/ui/button";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { useAuthStore } from "@/stores/auth";

/**
 * 03단계(SU-3) — 가입 완료. §0.2(자동 로그인 있음) 전제로 Figma 원안 그대로 구현한다 —
 * 세션이 있으니 이름·CTA 모두 Figma 카피를 그대로 쓴다(design.md §5).
 *
 * 반대 방향 가드: 세션 없이(새로고침·직접 URL 접근) 이 화면에 왔으면 `/`로 보낸다 —
 * `(protected)/layout.tsx`와 유사한 방식이지만 방향이 반대다.
 *
 * **2026-09-16 재작업**: Figma 노드(`1175:17313`)를 다시 대조하니 이 화면도 01/02와 같은
 * "제목+스텝 인디케이터" 헤더 행이 있었는데(`SignupStepIndicator`가 애초에 세 화면 공유용으로
 * 만들어졌었는데도) 빠져 있었다. 그 외에도: 헤더~본문 간격 64px가 아니라 128px, 환영 메시지가
 * `text-body-m`(14px)+`font-dark-secondary`+수동 줄바꿈이 아니라 `text-body-l`(16px)+
 * `font-dark`+한 줄, 버튼이 `w-full`이 아니라 고정 296px에 20px/600(표준 `text-button-xl`
 * 16px/500과 다름 — SU-1 소셜 버튼처럼 이 화면만의 오버라이드), 본문~푸터 간격 200px가 아니라
 * 234px였다.
 */
interface SignupCompletePanelProps {
  returnUrl: string | null;
}

export function SignupCompletePanel({ returnUrl }: SignupCompletePanelProps) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const name = useAuthStore((state) => state.user?.name);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/" as Route);
    }
  }, [status, router]);

  if (status !== "authenticated") {
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
    <div className="mx-auto flex w-full max-w-[55.5rem] flex-col items-center px-4 pt-16 pb-[14.625rem]">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-title-xl text-font-dark">회원가입 완료</h1>
        <SignupStepIndicator current={3} />
      </div>

      <div className="mt-32 flex w-full max-w-[26.5rem] flex-col items-center gap-16 text-center">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-title-xl text-font-dark">
            {name}님의 가입을 환영합니다!
          </h2>
          <p className="text-body-l text-font-dark">
            당신을 위한 멋진 작품들과 많은 장인들의 이야기가 기다리고 있어요!
          </p>
        </div>
        <Button
          type="button"
          size="xl"
          className="w-74 text-xl leading-[1.1] font-semibold"
          onClick={() => router.push(safeReturnUrl(returnUrl, "/") as Route)}
        >
          이전 페이지로 돌아가기
        </Button>
      </div>
    </div>
  );
}
