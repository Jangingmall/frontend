"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { CancelIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * IA CM-3 통합 검색바 본문 — 전체폭 입력창 + (값이 있을 때만) 지우기 버튼 + 우측 끝 검색 실행
 * 버튼(`temp/tasks/T-07-search-panel/design.md` §1·§3.1).
 *
 * 열림·닫힘 자체는 `Gnb`가 조건부 렌더로 마운트/언마운트하며 다룬다(`CategoryMegaPanel`과 동일한
 * 소유권 분리) — 이 컴포넌트는 자기 자신을 닫지 않는다. ESC·바깥 클릭·재클릭에 의한 닫힘은
 * `Gnb`가 처리하고, 검색 실행이 성공했을 때만 `onClose`로 "닫아도 된다"는 신호를 올려보낸다.
 * 마운트/언마운트로 열림·닫힘을 표현하는 덕에 "열릴 때 입력창 자동 포커스"(IA)도 곧 "마운트 시
 * 포커스"가 되고, 재열림 시 검색어가 항상 비어 있는 것(design.md §5-6)도 이 구조의 자연스러운
 * 결과다 — 검색어를 유지하려면 이 state를 `Gnb`로 끌어올려야 한다.
 *
 * 입력창(800px)·검색 실행 버튼을 한 그룹으로 묶어 헤더의 `grid-cols-[1fr_auto_1fr]`(로고 중앙
 * 정렬)과 같은 기법으로 가운데 정렬한다. Figma 실측은 입력창 단독이 페이지 중심에 오지만,
 * 버튼까지 포함하면 16px 오차가 생긴다 — 기존 정렬 기법을 재사용하는 코드 단순성이 그 오차보다
 * 이득이 크다고 판단했다(design.md §5-2).
 *
 * `<form role="search">`로 감싸 Enter 제출과 검색 버튼(`type="submit"`) 클릭을 브라우저 네이티브
 * 제출 이벤트 하나로 통일한다 — 수동 `onKeyDown` 분기가 필요 없다.
 */
interface SearchPanelProps {
  /** 검색 실행(라우팅) 성공 후 패널을 닫으라는 신호. ESC·바깥 클릭·재클릭은 `Gnb`가 직접 처리. */
  onClose: () => void;
  className?: string;
}

function SearchPanel({ onClose, className }: SearchPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  // 열릴 때(=마운트 시) 입력창 자동 포커스 — IA "열릴 때 입력창 자동 포커스".
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function clear() {
    setValue("");
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.trim();
    // 빈/공백뿐인 검색어로는 SR-1(검색 결과 페이지)에 안 보낸다 — 빈 q 처리 정책이 아직 없어
    // 불확실한 요청 자체를 만들지 않는 쪽을 택함(design.md §5-1).
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}` as Route);
    onClose();
  }

  return (
    <div
      data-slot="search-panel"
      className={cn(
        "absolute top-full left-0 w-full bg-bg-default shadow-nav",
        className,
      )}
    >
      <form
        role="search"
        aria-label="통합 검색"
        onSubmit={handleSubmit}
        className="grid h-17.5 grid-cols-[1fr_auto_1fr] items-center px-12"
      >
        <span aria-hidden="true" />
        <div className="flex items-center">
          {/* Figma 실측(리뷰 반영, 2026-09-13): `textfield` 프레임의
           * `individualStrokeWeights`가 `{top:0, right:0, bottom:1, left:0}` — 아래쪽에만
           * 1px 밑줄이 있고 색은 정확히 `#8E9A9C`(`--jade-blue-700` = `--border-jade-fill`).
           * design.md 최초안엔 테두리 자체를 안 다뤘던 걸 놓친 부분이라 여기서 보정한다. */}
          <div className="flex h-9.5 w-200 items-center gap-2 border-b border-border-jade-fill">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="검색어를 입력해주세요."
              className="min-w-0 flex-1 bg-transparent text-body-m text-font-dark outline-none placeholder:text-font-dark-subtle"
            />
            {value && (
              <button
                type="button"
                onClick={clear}
                aria-label="입력 지우기"
                className="flex size-7 shrink-0 items-center justify-center text-font-dark-subtle [&_path]:fill-current"
              >
                <CancelIcon className="size-6" />
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="검색 실행"
            className="flex size-8 shrink-0 items-center justify-center text-font-dark [&_path]:fill-current"
          >
            <SearchIcon className="size-6" />
          </button>
        </div>
        <span aria-hidden="true" />
      </form>
    </div>
  );
}

export { SearchPanel };
export type { SearchPanelProps };
