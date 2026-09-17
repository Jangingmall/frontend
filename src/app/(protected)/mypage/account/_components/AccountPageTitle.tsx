"use client";

import { useRouter } from "next/navigation";

import { ChevronLeftIcon } from "@/components/ui/icons";

/** "회원 정보 수정" 페이지 제목 + 뒤로가기 아이콘(Figma "Order Details Button" 패턴). */
function AccountPageTitle() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="뒤로 가기"
        onClick={() => router.back()}
        className="flex size-8 items-center justify-center"
      >
        <ChevronLeftIcon className="size-4" />
      </button>
      <h1 className="text-title-xl text-font-dark">회원 정보 수정</h1>
    </div>
  );
}

export { AccountPageTitle };
