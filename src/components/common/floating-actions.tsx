"use client";

import { AiChatIcon, ChevronRightIcon, TopIcon } from "@/components/ui/icons";

/**
 * CM-5 플로팅 버튼(Figma 어노테이션 `1193:10734`, 프레임 `987:25006` 우하단) — 맨 위로 +
 * 미담 챗봇. 디자인 시스템 `Floating` 컴포넌트셋(`SqfAZMSEs8GzNbJSQ4AEye`, 노드
 * `1481:2156`)에 실제 3-variant가 정의돼 있다 — `Default`(맨 위로 + 미담 챗봇 두 버튼),
 * `top`(맨 위로만, PD-1), `close`(접기 버튼 하나만, 챗봇 패널이 열려 있을 때). 라벨도 그
 * 컴포넌트 기준 "미담 챗봇"(기존엔 영문 "AI CHAT"이었음)으로 정정했다.
 *
 * IA상 "AI 추천 챗봇 버튼은 HO-1·PL-1·PL-2·PL-3에서만 노출"이라 전체 페이지에 까는 게
 * 아니라 딱 이 화면들에만 있어야 한다 — 그래서 `app/layout.tsx`(전역)가 아니라 각 화면의
 * `page.tsx`에서 개별 연결한다. `components/common/`에 두는 이유는 그 화면들이 이미
 * 같은 컴포넌트를 재사용할 수 있게 하기 위해서다. PD-1은 `showAiChat={false}`로 TOP만
 * 표시하고, 홈·목록의 기본 표시 방식은 유지한다.
 *
 * 이 컴포넌트는 순수 프레젠테이션이다(`docs/architecture.md` §6 — `components/common/`은
 * API·Query·store에 의존하지 않는다). 로그인 여부 판단·챗봇 세션 관리는 전부 호출부
 * (`app/site-floating-actions.tsx`) 책임이고, 이 컴포넌트는 `isChatOpen`·`onAiChatToggle`
 * 로만 상태를 받는다. `onAiChatToggle`이 없으면 기존처럼 비인터랙티브 표시로 남는다
 * (Storybook 단독 렌더 등 하위 호환).
 *
 * 아이콘(`TopIcon`/`AiChatIcon`/`ChevronRightIcon`)은 `fill`이 SVG `path`에 고정돼 있어
 * `text-*`만으론 색이 안 바뀐다 — `header.tsx`가 이미 쓰는 `[&_path]:fill-current` 패턴으로
 * 우회한다.
 *
 * 위치는 Figma 절대좌표로 맞췄다: 프레임(`987:25006`, 1440×923) 우측 끝에서 정확히 0px
 * (화면 오른쪽 끝에 딱 붙음), 하단에서 64px. 모서리는 라운드 없이 각짐 — `rectangleCornerRadii`
 * 가 왼쪽 위/아래 모서리에 바인딩돼 있길래 "왼쪽만 둥글다"로 오판해 `rounded-l-2xl`을
 * 넣었었는데, 실제 디자인은 라운드가 아예 없다(변수가 바인딩돼 있다고 값이 0이 아닌 건
 * 아니다 — Figma 변수 API가 막혀 있어 값 자체를 못 읽고 있었던 것). 라운드 클래스 제거.
 */
interface FloatingActionsProps {
  /** 이 페이지에 챗봇 진입점 자체가 있는지. `false`면 TOP만(Figma `top` variant). */
  showAiChat?: boolean;
  /** 챗봇 패널이 열려 있는지 — 열려 있으면 "접기" 버튼 하나만 보여준다(Figma `close`). */
  isChatOpen?: boolean;
  /** 미담 챗봇 버튼 / 접기 버튼 공용 클릭 핸들러. 안 주면 비인터랙티브(하위 호환). */
  onAiChatToggle?: () => void;
}

export function FloatingActions({
  showAiChat = true,
  isChatOpen = false,
  onAiChatToggle,
}: FloatingActionsProps) {
  return (
    <div className="fixed right-0 bottom-16 z-40 flex w-13 flex-col overflow-hidden bg-fill-neutral-impact text-font-white [&_path]:fill-current">
      {showAiChat && isChatOpen ? (
        <button
          type="button"
          onClick={onAiChatToggle}
          aria-label="챗봇 패널 접기"
          className="flex flex-col items-center gap-1 px-1 py-2 hover:bg-states-hover-25"
        >
          <ChevronRightIcon className="size-6" />
          <span className="text-caption">접기</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia?.(
                  "(prefers-reduced-motion: reduce)",
                ).matches
                  ? "instant"
                  : "smooth",
              })
            }
            aria-label="맨 위로"
            className="flex flex-col items-center gap-1 px-1 py-2 hover:bg-states-hover-25"
          >
            <TopIcon className="size-6" />
            <span className="text-caption">TOP</span>
          </button>
          {showAiChat &&
            (onAiChatToggle ? (
              <>
                <div aria-hidden="true" className="h-px bg-font-white/20" />
                <button
                  type="button"
                  onClick={onAiChatToggle}
                  aria-expanded={isChatOpen}
                  className="flex flex-col items-center gap-1 px-1 py-2 hover:bg-states-hover-25"
                >
                  <AiChatIcon className="size-6" />
                  <span className="text-caption">미담 챗봇</span>
                </button>
              </>
            ) : (
              <>
                <div aria-hidden="true" className="h-px bg-font-white/20" />
                <span
                  aria-disabled="true"
                  className="flex flex-col items-center gap-1 px-1 py-2 text-font-white/70"
                >
                  <AiChatIcon className="size-6" />
                  <span className="text-caption">미담 챗봇</span>
                </span>
              </>
            ))}
        </>
      )}
    </div>
  );
}
