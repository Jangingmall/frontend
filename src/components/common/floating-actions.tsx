"use client";

import { AiChatIcon, TopIcon } from "@/components/ui/icons";

/**
 * CM-5 플로팅 버튼(Figma 어노테이션 `1193:10734`, 프레임 `987:25006` 우하단) — 맨 위로 +
 * AI 추천 챗봇. IA 우선순위 P1이고 로드맵에 태스크 번호가 없어 처음엔 범위에서 뺐는데(T-16
 * design.md §1-2), 버튼 자체(둘 다 노출)는 이번에 만들고 **기능은 TOP만** 붙이기로 함
 * (AI 챗봇 패널은 별도 설계 필요 — 대화 흐름·추천 API가 아직 없다).
 *
 * IA(`98826581`)엔 "TOP은 1화면 이상 스크롤 시 노출"이라 적혀 있지만, 이 컴포넌트 바로 옆
 * Figma 어노테이션(`1193:10734`)은 "TOP · AI CHAT 둘 다 항상 노출"이라 더 구체적으로
 * 적혀 있어 그쪽을 따른다 — 스크롤 조건부 노출 로직 없이 항상 렌더링.
 *
 * `AL-1`처럼 실제 라우트가 없는 것과 달리 AI CHAT은 "아직 안 만든 기능"이라, GNB의
 * 비활성 항목과 같은 패턴(`aria-disabled` 비인터랙티브 요소)으로 처리한다.
 *
 * IA상 "AI 추천 챗봇 버튼은 HO-1·PL-1·PL-2·PL-3에서만 노출"이라 전체 페이지에 까는 게
 * 아니라 딱 이 화면들에만 있어야 한다 — 그래서 `app/layout.tsx`(전역)가 아니라 각 화면의
 * `page.tsx`에서 개별 연결한다. `components/common/`에 두는 이유는 그 화면들이 이미
 * 같은 컴포넌트를 그대로 재사용할 수 있게 하기 위해서다(PL-1·PL-2·PL-3는 아직 미착수 —
 * 그 작업에서 여기 import만 추가하면 된다). 지금은 홈(`app/page.tsx`)에서만 렌더링.
 *
 * 아이콘(`TopIcon`/`AiChatIcon`)은 `fill`이 SVG `path`에 고정돼 있어 `text-*`만으론 색이
 * 안 바뀐다 — `header.tsx`가 이미 쓰는 `[&_path]:fill-current` 패턴으로 우회한다.
 *
 * 위치·모양은 Figma 절대좌표로 다시 맞췄다: 프레임(`987:25006`, 1440×923) 우측 끝에서
 * 정확히 0px(화면 오른쪽 끝에 딱 붙음), 하단에서 64px. `rectangleCornerRadii`가 왼쪽
 * 위/아래 모서리에만 바인딩돼 있어(오른쪽은 없음) — 화면 끝에 붙는 모양이라 오른쪽은
 * 각지고 왼쪽만 둥글다(`rounded-xl`로 네 모서리를 다 둥글렸던 게 틀림). 정확한 radius
 * px 값은 Figma 변수 API가 막혀 있어(`temp/figma-token.md`) 못 읽었고, 캡슐 형태에
 * 맞는 값으로 근사했다.
 */
export function FloatingActions() {
  return (
    <div className="fixed right-0 bottom-16 z-40 flex w-13 flex-col overflow-hidden rounded-l-2xl bg-fill-neutral-impact text-font-white [&_path]:fill-current">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="맨 위로"
        className="flex flex-col items-center gap-1 px-1 py-2 hover:bg-states-hover-25"
      >
        <TopIcon className="size-6" />
        <span className="text-caption">TOP</span>
      </button>
      <div aria-hidden="true" className="h-px bg-font-white/20" />
      <span
        aria-disabled="true"
        className="flex flex-col items-center gap-1 px-1 py-2 text-font-white/70"
      >
        <AiChatIcon className="size-6" />
        <span className="text-caption">AI CHAT</span>
      </span>
    </div>
  );
}
