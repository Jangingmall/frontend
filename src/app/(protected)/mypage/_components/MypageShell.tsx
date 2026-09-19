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
 *
 * `mx-auto`는 `flex-1`·`max-w-165`와 같은 요소에 있어야 한다 — flex item에 auto 마진을
 * 주면 flex-grow가 max-width에 막혀 남긴 여유 공간을 마진이 흡수해 가운데 정렬된다(CSS
 * flexbox 스펙). 이 클래스를 빠뜨리면 660px 박스가 사이드바 옆에 왼쪽 정렬로 붙어버린다
 * (사용자 피드백으로 재확인한 회귀 — 폭 cap을 화면별로 나누며 재작성하다 빠졌었다).
 *
 * 제목과 2단 행 사이 간격은 48px(`gap-12`)다 — Figma ID-3에 "여백 48px" 주석이 내비게이션
 * 바 밑(→제목)과 제목 밑(→2단 행)에 각각 하나씩, 총 두 번 나온다(2026-09-17
 * `get_design_context` 대조). `py-12`(navbar↔제목)만 맞추고 이 gap을 24px로 둔 채
 * 넘어갔던 걸 정정.
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
    <div className="mx-auto flex w-full max-w-360 flex-col gap-12 px-8 py-12">
      {title}
      <div className="flex gap-6">
        {sidebar}
        <div
          className={cn("mx-auto max-w-165 min-w-0 flex-1", contentClassName)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { MypageShell };
export type { MypageShellProps };
