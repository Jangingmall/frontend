"use client";

import type { KeyboardEvent, MouseEvent } from "react";

import {
  StarEmptyIcon,
  StarFilledIcon,
  StarHalfIcon,
} from "@/components/ui/icons";

const STAR_COUNT = 5;
const STEP = 0.5;

interface ReviewRatingInputProps {
  /** 0(미선택)~5, 0.5 단위. */
  value: number;
  onChange: (value: number) => void;
  error?: string;
  "aria-label"?: string;
}

function clamp(value: number): number {
  return Math.min(STAR_COUNT, Math.max(0, value));
}

/**
 * 후기 작성 모달의 인터랙티브 별점 입력. 별 하나(`size-8`, Figma 실측)를 좌/우 절반으로
 * 나눠 좌측 클릭 → `index + 0.5`, 우측 클릭 → `index + 1`. 컨테이너에 `role="slider"`로
 * 방향키(←/→ 0.5 단위, Home/End) 접근성을 더한다.
 */
export function ReviewRatingInput({
  value,
  onChange,
  error,
  "aria-label": ariaLabel = "별점",
}: ReviewRatingInputProps) {
  function handleStarClick(
    event: MouseEvent<HTMLButtonElement>,
    index: number,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    onChange(clamp(index + (isLeftHalf ? 0.5 : 1)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clamp(value + STEP));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(clamp(value - STEP));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(STAR_COUNT);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={STAR_COUNT}
        aria-valuenow={value}
        aria-valuetext={value === 0 ? "미선택" : `5점 만점에 ${value}점`}
        onKeyDown={handleKeyDown}
        className="flex w-fit items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-border-jade-fill"
      >
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const Star =
            value >= index + 1
              ? StarFilledIcon
              : value >= index + 0.5
                ? StarHalfIcon
                : StarEmptyIcon;
          return (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              data-testid={`review-rating-star-${index}`}
              onClick={(event) => handleStarClick(event, index)}
              className="flex size-8 items-center justify-center"
              aria-hidden
            >
              <Star className="size-8" />
            </button>
          );
        })}
      </div>
      {error != null && (
        <p role="alert" className="text-caption text-red-font">
          {error}
        </p>
      )}
    </div>
  );
}
