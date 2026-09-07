import { Progress } from "@base-ui/react/progress";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Figma `[FE] Components / progress-bar` set. 4칸 stepped 바(각 칸 4px, gap 8, pill).
 * `State` 는 채워진 칸 수 + 색을 함께 결정한다:
 *   default 0 · alert 1(red) · caution 2(yellow) · good 3(green) · perfect 4(green)
 * 위쪽 라벨(label-1 / label-2)은 옵션. 색은 컴포넌트 토큰 `--progress-bar-*` + 빈 칸
 * `--fill-neutral-weak`. a11y 는 `@base-ui/react/progress`(value=칸수, max=4)로 확보.
 */
const SEGMENTS = 4;

const STATE_MAP = {
  default: { filled: 0, fill: "" },
  alert: { filled: 1, fill: "bg-(--progress-bar-red)" },
  caution: { filled: 2, fill: "bg-(--progress-bar-yellow)" },
  good: { filled: 3, fill: "bg-(--progress-bar-green)" },
  perfect: { filled: 4, fill: "bg-(--progress-bar-green)" },
} as const;

type ProgressState = keyof typeof STATE_MAP;

interface ProgressBarProps {
  /** Figma State — 채워진 칸 수와 색을 함께 결정 */
  state?: ProgressState;
  label?: ReactNode;
  labelEnd?: ReactNode;
  className?: string;
}

function ProgressBar({
  state = "default",
  label,
  labelEnd,
  className,
}: ProgressBarProps) {
  const { filled, fill } = STATE_MAP[state];

  return (
    <Progress.Root
      value={filled}
      max={SEGMENTS}
      data-slot="progress-bar"
      className={cn("flex flex-col gap-2", className)}
    >
      {(label != null || labelEnd != null) && (
        <div className="flex items-center justify-between">
          <Progress.Label className="text-caption text-font-dark-subtle">
            {label}
          </Progress.Label>
          <span className="text-caption text-font-dark-subtle">{labelEnd}</span>
        </div>
      )}
      <Progress.Track className="flex h-1 gap-2 bg-transparent">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-full flex-1 rounded-full bg-fill-neutral-weak",
              i < filled && fill,
            )}
          />
        ))}
      </Progress.Track>
    </Progress.Root>
  );
}

export { ProgressBar };
export type { ProgressBarProps, ProgressState };
