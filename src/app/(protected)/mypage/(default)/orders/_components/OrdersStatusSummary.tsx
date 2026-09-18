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

/**
 * "내 주문 현황" 요약 — 4단계 진행 카운트 + 교환환불/주문취소 미니 카운트(design.md §6.1).
 * 박스 스타일(테두리 `#c8d9dc`·그림자·48px/12px 패딩·최소높이 88px)은
 * `get_design_context`(node `1579:10063`) 실측값 그대로 — 제목은 박스 밖에 있다.
 */
function OrdersStatusSummary({
  data,
  isPending,
  hasError,
  onRetry,
}: OrdersStatusSummaryProps) {
  return (
    <section aria-label="내 주문 현황" className="flex flex-col gap-4">
      <h2 className="text-title-s text-font-dark">내 주문 현황 보기</h2>
      <div className="flex flex-col gap-1">
        <div className="flex min-h-22 flex-col justify-center rounded-xs border border-border-jade-weak bg-bg-default px-12 py-3 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]">
          {hasError ? (
            <ErrorState title="불러오지 못했어요" onRetry={onRetry} />
          ) : isPending || !data ? (
            <div role="status" className="flex items-center gap-6">
              <span className="sr-only">주문 현황을 불러오는 중</span>
              <Skeleton className="h-14 flex-1" />
            </div>
          ) : (
            <div className="flex items-center gap-10">
              <div className="flex flex-1 items-center gap-10">
                {ORDER_STAGE_SUMMARY_KEYS.map((key, index) => (
                  <div key={key} className="flex items-center gap-10">
                    <div className="flex w-30 flex-col items-center gap-3 px-2 text-center">
                      <p className="w-full text-body-m text-font-dark">
                        {STAGE_LABEL.get(key)}
                      </p>
                      <p className="w-full text-title-m text-font-dark">
                        {data[STAGE_FIELD[key]]}
                      </p>
                    </div>
                    {index < ORDER_STAGE_SUMMARY_KEYS.length - 1 && (
                      <ChevronRightIcon
                        aria-hidden
                        className="size-6 shrink-0 text-font-dark"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div
                className="h-14.5 w-px shrink-0 bg-border-jade-weak"
                aria-hidden
              />
              <div className="flex max-w-36 min-w-28 flex-1 flex-col gap-2 px-4 whitespace-nowrap text-font-dark">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-s">
                    교환<span className="font-bold">{" · "}</span>환불
                  </span>
                  <span className="text-right text-body-m font-bold">
                    {data.exchangeRefund}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-s">주문취소</span>
                  <span className="text-right text-body-m font-bold">
                    {data.canceled}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {!hasError && (
          <p className="w-full text-right text-caption text-font-label">
            (최근 3개월 기준)
          </p>
        )}
      </div>
    </section>
  );
}

export { OrdersStatusSummary };
export type { OrdersStatusSummaryProps };
