import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / toast` COMPONENT. 알림 바 — 메시지 + 선택적 액션 버튼(`button` bool).
 *   - 컨테이너: h 40, `rounded-sm`(4), `--fill-neutral-impact`(#121B29), `shadow-floating`
 *   - 메시지: `text-body-s`(13/400) 흰색, 좌우 padding 24
 *   - 액션 버튼: `rounded-xs`(2), `--fill-jade`(#C8D9DC), `text-caption-b`(10/600) 다크, h 30.
 *     hover 는 Figma Stateslayer 처럼 `::before` 로 `--states-hover`(50%) 오버레이.
 *
 * 이 컴포넌트는 시각적 바만 담당한다. 큐잉·자동 닫힘·위치 지정이 필요하면
 * `@base-ui/react/toast`(Provider/Viewport/Manager)로 감싸서 쓴다.
 */
interface ToastProps {
  children: ReactNode;
  /** `onAction` 과 함께 있어야 오른쪽에 액션 버튼이 노출된다 */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

function Toast({ children, actionLabel, onAction, className }: ToastProps) {
  return (
    <div
      role="status"
      data-slot="toast"
      className={cn(
        "inline-flex h-10 items-center rounded-sm bg-fill-neutral-impact px-2 shadow-floating",
        className,
      )}
    >
      <span className="px-6 text-body-s text-font-white">{children}</span>
      {actionLabel != null && onAction != null && (
        <button
          type="button"
          onClick={onAction}
          className="relative isolate h-7.5 shrink-0 overflow-hidden rounded-xs bg-fill-jade px-6 text-caption-b text-font-dark before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:transition-colors hover:before:bg-states-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export { Toast };
export type { ToastProps };
