"use client";
import { useEffect, useId, useRef } from "react";

interface StudioHelpProps {
  api?: boolean;
  mvp?: boolean;
  step: number | null;
  onStepChange: (step: number | null) => void;
}

export function StudioHelp({
  api = false,
  mvp = false,
  step,
  onStepChange,
}: StudioHelpProps) {
  const titleId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mvp || step === null) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node))
        onStepChange(null);
    };
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, [mvp, step, onStepChange]);
  const close = () => {
    onStepChange(null);
    trigger.current?.focus();
  };
  return (
    <div className="ss-help" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="ss-help-trigger"
        aria-label="편집 도움말"
        aria-expanded={step !== null}
        data-tooltip="도움말"
        onClick={() => onStepChange(step === null ? 0 : null)}
      >
        ?
      </button>
      {step !== null && (
        <section
          className="ss-help-card"
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <button
            type="button"
            className="ss-help-close"
            aria-label="도움말 닫기"
            onClick={close}
          >
            ×
          </button>
          <h2 id={titleId}>
            {["처음 사용하시나요?", "글과 사진 편집", "저장과 최종 확인"][step]}
          </h2>
          <p>
            {step === 0
              ? "화면 왼쪽 하단의 ? 를 누르면 언제든지 도움말을 확인할 수 있어요."
              : step === 1
                ? api
                  ? "왼쪽에서 글을 수정하고 사진을 교체하면 실제 응답 문서의 미리보기에 반영됩니다. 배치와 서식은 AI가 만든 구성을 유지합니다."
                  : "왼쪽 도구에서 글이나 사진을 선택해 수정하세요. 페이지 목록으로 이동하고 실행 취소와 다시 실행으로 변경을 되돌릴 수 있어요."
                : api
                  ? "서버에 저장한 뒤 최종 확인에서 내용을 검수하세요. 승인과 콘텐츠 게시를 순서대로 진행할 수 있어요."
                  : "임시 저장은 이 브라우저에 저장합니다. 제작 완료를 누르면 PC·태블릿·모바일 화면을 확인할 수 있어요."}
          </p>
          <div className="ss-help-actions">
            <button type="button" onClick={close}>
              건너뛰기
            </button>
            <button
              type="button"
              disabled={mvp}
              onClick={() => (step === 2 ? close() : onStepChange(step + 1))}
            >
              {["튜토리얼 시작하기", "다음", "완료"][step]}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
