"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { CancelIcon } from "./icons";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  hideTitle?: boolean;
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
            className={cn(
              "relative max-h-full w-full max-w-lg overflow-y-auto overscroll-contain rounded-xs bg-bg-default p-6 text-font-dark shadow-floating outline-none",
              className,
            )}
          >
            <DialogPrimitive.Title
              className={cn("pr-10 text-title-l", hideTitle && "sr-only")}
            >
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-3 text-body-m text-font-dark-subtle">
                {description}
              </DialogPrimitive.Description>
            )}
            <DialogPrimitive.Close
              data-slot="dialog-close"
              aria-label="닫기"
              className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-border-jade-fill"
            >
              <CancelIcon className="size-6 [&_path]:fill-current" />
            </DialogPrimitive.Close>
            <div className={cn(!hideTitle && "mt-6")}>{children}</div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export type { DialogProps };
