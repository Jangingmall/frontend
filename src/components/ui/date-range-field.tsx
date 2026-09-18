"use client";

import "react-day-picker/style.css";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import dayjs from "dayjs";
import { useState } from "react";
import { type DateRange, DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { cn } from "@/lib/utils";

import { CalendarIcon } from "./icons";

/**
 * 임의 날짜 범위 선택 필드. Figma `select-box`(캘린더 아이콘) 트리거 톤 + `react-day-picker`
 * 팝업(`mode="range"`). `Select`(`select.tsx`)와 같은 결로 `@base-ui/react`(여기선 `Popover`)를
 * 헤드리스 프리미티브로 감싸 Tailwind로 직접 스타일링한다.
 *
 * `react-day-picker`의 구조 CSS(`style.css`)는 그대로 가져오고, 색상만 프로젝트 디자인
 * 토큰(`--rdp-accent-color` 등 CSS 변수)으로 덮어써 전체 클래스를 재작성하지 않는다.
 */
interface DateRangeFieldProps {
  /** ISO 날짜(`YYYY-MM-DD`) */
  from: string;
  /** ISO 날짜(`YYYY-MM-DD`) */
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  ariaLabel?: string;
  className?: string;
}

function DateRangeField({
  from,
  to,
  onChange,
  ariaLabel,
  className,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const committed: DateRange = {
    from: dayjs(from).toDate(),
    to: dayjs(to).toDate(),
  };
  // 선택 도중(첫 클릭 후 끝점 미확정 상태)엔 부모에 아직 안 알린다 — `from`/`to` props는
  // 항상 "완결된" 값이라, 그걸 그대로 `selected`에 되먹이면 매 클릭이 기존 완결 범위의
  // 연장으로만 해석돼(`resetOnSelect`) 두 번째 클릭으로 새 범위를 완성할 수 없다. 팝업을 열 때
  // 마지막 확정값으로 이 draft를 다시 채운다.
  const [draft, setDraft] = useState<DateRange | undefined>(committed);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(committed);
      }}
    >
      <PopoverPrimitive.Trigger
        aria-label={ariaLabel}
        data-slot="date-range-field-trigger"
        className={cn(
          "flex h-9 items-center justify-between gap-2 rounded-xs border border-border-jade-fill bg-bg-default px-2 text-body-s text-font-dark-subtle outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-jade-fill",
          className,
        )}
      >
        <span>
          {from === to
            ? dayjs(from).format("YYYY.MM.DD")
            : `${dayjs(from).format("YYYY.MM.DD")} – ${dayjs(to).format("YYYY.MM.DD")}`}
        </span>
        <CalendarIcon aria-hidden className="size-4 shrink-0 text-font-dark" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          sideOffset={4}
          className="z-50 outline-none"
        >
          <PopoverPrimitive.Popup
            data-slot="date-range-field-popup"
            className={cn(
              "rounded-xs border border-border-neutral-weak bg-bg-default p-3 text-body-s text-font-dark shadow-nav outline-none",
              "[--rdp-accent-background-color:var(--fill-jade-weak)] [--rdp-accent-color:var(--border-jade-fill)] [--rdp-today-color:var(--border-jade-fill)]",
            )}
          >
            <DayPicker
              mode="range"
              locale={ko}
              defaultMonth={committed.from}
              selected={draft}
              resetOnSelect
              onSelect={(range) => {
                setDraft(range);
                if (!range?.from || !range?.to) return;
                onChange({
                  from: dayjs(range.from).format("YYYY-MM-DD"),
                  to: dayjs(range.to).format("YYYY-MM-DD"),
                });
                setOpen(false);
              }}
            />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DateRangeField };
export type { DateRangeFieldProps };
