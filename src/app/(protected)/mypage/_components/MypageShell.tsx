import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 마이페이지 공용 셸 — 제목(전체 폭) + 좌측 내비/우측 콘텐츠 2단 구성.
 *
 * `/mypage/*` 일반 페이지(8항목 사이드바, "마이페이지" 제목)와 `/mypage/account/*`
 * (4항목 서브내비, "회원 정보 수정" 제목)가 좌측 내비 내용만 다르고 이 뼈대는 공유한다
 * — Figma 대조 결과 두 셸은 서로 다른 좌측 내비를 쓰지만 바깥 레이아웃(제목 위치, 2단
 * 구성, 사이드바 폭)은 동일하다.
 *
 * 콘텐츠 영역은 기본 660px cap(`max-w-165`)을 갖는다 — Figma ID-1(내 정보 수정)의
 * "Profile Container"가 660px 고정폭이고, placeholder뿐인 나머지 화면들도 이 폭이 무난한
 * 기본값이다. ID-3(배송지)의 "Shipping Info"만 1116px로 사이드바 옆 남은 공간을 거의 다
 * 쓰므로(2026-09-17 `get_design_context` 대조), 그 화면 하나만 `contentClassName`으로
 * cap을 풀어준다 — 셸 레벨 기본값을 아예 없애면 폭 기준이 없는 다른 화면들까지 같이
 * 넓어지는 회귀가 난다(사용자 피드백으로 확인).
 */
interface MypageShellProps {
  title: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  /** 기본 660px cap을 바꿔야 하는 화면(배송지 등)만 넘긴다. */
  contentClassName?: string;
}

function MypageShell({
  title,
  sidebar,
  children,
  contentClassName,
}: MypageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-8 py-12">
      {title}
      <div className="flex gap-6">
        {sidebar}
        <div className={cn("max-w-165 min-w-0 flex-1", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { MypageShell };
export type { MypageShellProps };
