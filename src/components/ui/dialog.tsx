"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { CancelIcon } from "./icons";

const dialogVariants = cva(
  "relative max-h-full w-full overscroll-contain rounded-xs bg-bg-default text-font-dark shadow-floating outline-none",
  {
    variants: {
      variant: {
        default: "max-w-lg overflow-y-auto p-6",
        form: "flex max-w-140 flex-col gap-3 overflow-hidden py-6",
        confirmation: "max-w-120 overflow-y-auto px-6 pt-16 pb-6",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface DialogProps extends VariantProps<typeof dialogVariants> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  hideTitle?: boolean;
  /** form 헤더의 필터 등 제목 옆에 놓이는 컨트롤 */
  headerAction?: ReactNode;
  /** form 본문 스크롤과 분리되는 하단 액션 */
  footer?: ReactNode;
  /** form/confirmation은 하단 액션으로 닫으며, 기본 모달은 X 버튼을 표시한다. */
  showClose?: boolean;
  /**
   * `variant="form"` 전용. 기본(`true`)은 본문을 548px(`h-137`)로 고정해 내부 스크롤한다
   * — 문의 폼처럼 긴 폼에 맞는 값이다. 배송지 폼처럼 짧은 폼에 그대로 적용하면 내용
   * 아래로 빈 공간이 크게 남는다(사용자 피드백) — `false`를 주면 548px를 상한으로만 두고
   * 내용 높이에 맞춘다.
   */
  scrollableContent?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  hideTitle = false,
  variant = "default",
  headerAction,
  footer,
  showClose = variant === "default",
  scrollableContent = true,
  onClick,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {/* 하위 Select 포털은 이 포털 아래에 붙는다. 모달 내부 z-10보다 Select z-50이 높다. */}
      <DialogPrimitive.Portal className="relative z-60">
        <DialogPrimitive.Backdrop
          data-slot="dialog-backdrop"
          className="fixed inset-0 bg-bg-deam"
        />
        <DialogPrimitive.Viewport className="fixed inset-0 z-10 flex items-center justify-center overflow-y-auto p-6">
          <DialogPrimitive.Popup
            onClick={onClick}
            data-slot="dialog-popup"
            className={cn(dialogVariants({ variant }), className)}
          >
            <div
              className={cn(
                variant === "form" &&
                  "flex min-h-9.5 shrink-0 items-center justify-between gap-3 px-6 pb-2",
                variant === "confirmation" && "text-center",
              )}
            >
              <div>
                <DialogPrimitive.Title
                  className={cn(
                    variant === "form" ? "text-title-m" : "text-title-l",
                    showClose && "pr-10",
                    hideTitle && "sr-only",
                  )}
                >
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description
                    className={cn(
                      "mt-3 text-body-m text-font-dark-subtle",
                      variant === "confirmation" &&
                        "mt-2 text-body-l text-font-dark",
                    )}
                  >
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {headerAction}
            </div>
            {showClose && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                aria-label="닫기"
                className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-border-jade-fill"
              >
                <CancelIcon className="size-6 [&_path]:fill-current" />
              </DialogPrimitive.Close>
            )}
            <div
              data-slot="dialog-content"
              className={cn(
                variant === "default" && !hideTitle && "mt-6",
                variant === "form" &&
                  cn(
                    "mr-1 scrollbar-slim min-h-0 overflow-y-auto overscroll-contain pr-4 pl-6",
                    scrollableContent ? "h-137" : "max-h-137",
                  ),
                variant === "confirmation" && "mt-12",
              )}
            >
              {children}
            </div>
            {footer && (
              <div
                data-slot="dialog-footer"
                className={cn(
                  "shrink-0",
                  variant === "form" ? "px-6 pt-6" : "mt-6",
                )}
              >
                {footer}
              </div>
            )}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export type { DialogProps };
