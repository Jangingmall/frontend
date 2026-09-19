"use client";

import { useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderDelivery } from "@/types/order";

const DELIVERY_STATUS_LABEL: Record<OrderDelivery["status"], string> = {
  SHIPPED: "발송 완료",
  IN_TRANSIT: "배송 중",
  DELIVERED: "배송 완료",
};

interface DeliveryTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: OrderDelivery;
  isPending: boolean;
  hasError: boolean;
  onRetry: () => void;
}

/**
 * "배송 조회"(OD-2) 모달. 택배사명·운송장번호(복사)·3단계 상태만 보여준다 — BE가
 * 이동 이력·택배사 코드를 응답에서 버려서(`be-requests.md` #5) "택배사 조회 페이지에서
 * 보기" 링크는 만들지 않는다(design.md §4.4).
 */
export function DeliveryTrackingModal({
  open,
  onOpenChange,
  data,
  isPending,
  hasError,
  onRetry,
}: DeliveryTrackingModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패는 조용히 무시 — 사용자가 텍스트를 직접 선택해 복사할 수 있다.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="배송 조회">
      {isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}
      {hasError && (
        <ErrorState
          title="배송 정보를 불러오지 못했어요"
          onRetry={onRetry}
          className="px-0 py-6"
        />
      )}
      {data && (
        <div className="flex flex-col gap-3 text-body-m text-font-dark">
          <div className="flex justify-between">
            <span className="text-font-dark-secondary">택배사</span>
            <span>{data.carrier}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-font-dark-secondary">운송장번호</span>
            <div className="flex items-center gap-2">
              <span>{data.trackingNumber}</span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="text-body-s text-font-dark-secondary underline underline-offset-2"
              >
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-font-dark-secondary">배송 상태</span>
            <Badge variant="plain">{DELIVERY_STATUS_LABEL[data.status]}</Badge>
          </div>
        </div>
      )}
    </Dialog>
  );
}
