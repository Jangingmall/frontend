import type { ReactNode } from "react";

/**
 * 마이페이지 공용 셸 — 제목(전체 폭) + 좌측 내비/우측 콘텐츠 2단 구성.
 *
 * `/mypage/*` 일반 페이지(8항목 사이드바, "마이페이지" 제목)와 `/mypage/account/*`
 * (4항목 서브내비, "회원 정보 수정" 제목)가 좌측 내비 내용만 다르고 이 뼈대는 공유한다
 * — Figma 대조 결과 두 셸은 서로 다른 좌측 내비를 쓰지만 바깥 레이아웃(제목 위치, 2단
 * 구성, 사이드바 폭)은 동일하다.
 *
 * 콘텐츠 영역은 `flex-1`로 남은 폭을 다 차지하지 않는다 — Figma ID-1의 "Profile
 * Container"가 660px 고정폭이고, 사이드바-콘텐츠 간격(252px)과 콘텐츠-페이지 우측 여백
 * (276px)이 비슷해 그 660px 박스가 남은 공간 안에서 가운데 정렬된 것으로 측정됐다
 * (2026-09-17 `get_design_context` 대조). `max-w-165`(660px) + `mx-auto`로 재현한다.
 */
interface MypageShellProps {
  title: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

function MypageShell({ title, sidebar, children }: MypageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-360 flex-col gap-6 px-8 py-12">
      {title}
      <div className="flex gap-6">
        {sidebar}
        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-165">{children}</div>
        </div>
      </div>
    </div>
  );
}

export { MypageShell };
export type { MypageShellProps };
