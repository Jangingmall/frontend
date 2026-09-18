import { ErrorState } from "@/components/common/error-state";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ORDER_STAGE_SUMMARY_KEYS,
  ORDER_STATUS_FILTER_TABS,
} from "@/constants/order";
import type { OrderStatusSummary } from "@/types/order";

interface OrdersStatusSummaryProps {
  data?: OrderStatusSummary;
  isPending: boolean;
  hasError: boolean;
  onRetry: () => void;
}

const STAGE_LABEL = new Map(
  ORDER_STATUS_FILTER_TABS.map((tab) => [tab.key, tab.label]),
);

const STAGE_FIELD: Record<
  (typeof ORDER_STAGE_SUMMARY_KEYS)[number],
  keyof OrderStatusSummary
> = {
  PAYMENT_PENDING: "paymentPending",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
};

/** "내 주문 현황" 요약 — 4단계 진행 카운트 + 교환환불/주문취소 미니 카운트(design.md §6.1). */
function OrdersStatusSummary({
  data,
  isPending,
  hasError,
  onRetry,
}: OrdersStatusSummaryProps) {
  return (
    <section
      aria-label="내 주문 현황"
      className="rounded-xs border border-border-neutral-weak p-4"
    >
      <h2 className="mb-4 text-title-s text-font-dark">내 주문 현황 보기</h2>

      {hasError ? (
        <ErrorState title="불러오지 못했어요" onRetry={onRetry} />
      ) : isPending || !data ? (
        <div role="status" className="flex items-center gap-6">
          <span className="sr-only">주문 현황을 불러오는 중</span>
          <Skeleton className="h-14 flex-1" />
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="flex flex-1 items-center gap-6">
            {ORDER_STAGE_SUMMARY_KEYS.map((key, index) => (
              <div key={key} className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <p className="text-body-s text-font-dark-secondary">
                    {STAGE_LABEL.get(key)}
                  </p>
                  <p className="text-title-m text-font-dark">
                    {data[STAGE_FIELD[key]]}
                  </p>
                </div>
                {index < ORDER_STAGE_SUMMARY_KEYS.length - 1 && (
                  <ChevronRightIcon
                    aria-hidden
                    className="size-4 text-font-dark-subtle"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="h-14 w-px bg-border-neutral-weak" aria-hidden />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4 text-body-s">
              <span className="text-font-dark-secondary">교환 · 환불</span>
              <span className="text-title-s text-font-dark">
                {data.exchangeRefund}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-body-s">
              <span className="text-font-dark-secondary">주문취소</span>
              <span className="text-title-s text-font-dark">
                {data.canceled}
              </span>
            </div>
          </div>
        </div>
      )}

      {!hasError && (
        <p className="mt-2 text-right text-caption text-font-dark-subtle">
          (최근 3개월 기준)
        </p>
      )}
    </section>
  );
}

export { OrdersStatusSummary };
export type { OrdersStatusSummaryProps };
