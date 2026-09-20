"use client";

import { useSearchParams } from "next/navigation";

import { OrdersFilterBar } from "@/app/(protected)/mypage/orders/(list)/_components/OrdersFilterBar";
import { OrdersList } from "@/app/(protected)/mypage/orders/(list)/_components/OrdersList";
import {
  type OrdersFilterState,
  parseOrdersSearchParams,
  toOrdersListQuery,
  updateOrdersSearchParams,
} from "@/app/(protected)/mypage/orders/(list)/_lib/search-params";
import {
  CANCELLATION_NOTICES,
  CANCELLATION_STATUS_FILTER_TABS,
  type OrderPeriodPreset,
  type OrderStatusGroupKey,
  resolveOrderPeriod,
} from "@/constants/order";
import { useOrdersListQuery } from "@/queries/orders/queries";

/**
 * 취소·교환·환불 내역(Figma MY-2, `/mypage/orders/cancellations`) — MY-1(`/mypage/orders`)에
 * 상태 필터를 고정한 변형이다. 셸·필터바·카드·페이지네이션은 전부 MY-1과 같은 컴포넌트를
 * 재사용하고(같은 `(list)` route group의 형제 라우트), 상태 탭 3종(전체/교환·환불/주문취소)과
 * 안내 문구만 이 화면 전용으로 바꾼다(design.md §0.1, §5.1).
 *
 * 요약 스트립(`OrdersStatusSummary`)은 그리지 않는다. `onAction`도 안 넘긴다 — 이 화면이
 * 보여주는 상태(교환·환불·취소 완료류)엔 `cancelOrder`·`requestExchangeRefund` 둘 다
 * 매트릭스에 없어 모달을 열 카드가 없다(design.md §0.4).
 */
export default function MypageOrderCancellationsPage() {
  const searchParams = useSearchParams();
  const filterState = parseOrdersSearchParams(
    new URLSearchParams(searchParams.toString()),
  );

  const listQuery = useOrdersListQuery(toOrdersListQuery(filterState));

  function updateUrl(patch: Partial<OrdersFilterState>) {
    const params = updateOrdersSearchParams(
      new URLSearchParams(window.location.search),
      patch,
    );
    window.history.pushState(
      null,
      "",
      `/mypage/orders/cancellations${params.size ? `?${params}` : ""}`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <OrdersFilterBar
        period={filterState.period}
        from={filterState.from}
        to={filterState.to}
        status={filterState.status}
        artisanName={filterState.artisanName}
        statusTabs={CANCELLATION_STATUS_FILTER_TABS}
        notices={CANCELLATION_NOTICES}
        onPeriodChange={(preset: OrderPeriodPreset) => {
          const range = resolveOrderPeriod(preset);
          updateUrl({ period: preset, from: range.from, to: range.to });
        }}
        onCustomRangeChange={(range) =>
          updateUrl({ period: "CUSTOM", from: range.from, to: range.to })
        }
        onStatusChange={(status: "ALL" | OrderStatusGroupKey) =>
          updateUrl({ status })
        }
        onSearch={(artisanName) =>
          updateUrl({ artisanName: artisanName || undefined })
        }
      />
      <OrdersList
        data={listQuery.data}
        isPending={listQuery.isPending}
        isFetching={listQuery.isFetching}
        hasError={listQuery.isError}
        onRetry={() => void listQuery.refetch()}
        onPageChange={(page) => updateUrl({ page })}
      />
    </div>
  );
}
