"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { ChevronLeftIcon } from "@/components/ui/icons";

/**
 * "회원 정보 수정" 페이지 제목 + 뒤로가기 아이콘(Figma "Order Details Button" 패턴,
 * 아이콘 32px — 2026-09-17 `get_design_context` 대조로 정정, 이전엔 16px이었다).
 *
 * `router.back()`이 아니라 `/mypage`로 고정 이동한다 — 히스토리 기반 뒤로가기는 진입
 * 경로에 따라 계정 섹션을 완전히 못 벗어나거나(tab 전환 기록만 되돌아감) 사이트 밖으로
 * 나갈 수 있어(직접 진입) 예측 가능한 목적지가 아니다(사용자 피드백).
 */
function AccountPageTitle() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="마이페이지로 돌아가기"
        onClick={() => router.push("/mypage" as Route)}
        className="flex size-8 items-center justify-center"
      >
        <ChevronLeftIcon className="size-8" />
      </button>
      <h1 className="text-title-xl text-font-dark">회원 정보 수정</h1>
    </div>
  );
}

export { AccountPageTitle };
