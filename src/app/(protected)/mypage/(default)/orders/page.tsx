"use client";

import { useSearchParams } from "next/navigation";

import {
  type OrderPeriodPreset,
  type OrderStatusGroupKey,
  resolveOrderPeriod,
} from "@/constants/order";
import {
  useOrdersListQuery,
  useOrderStatusSummaryQuery,
} from "@/queries/orders/queries";

import { OrdersFilterBar } from "./_components/OrdersFilterBar";
import { OrdersList } from "./_components/OrdersList";
import { OrdersStatusSummary } from "./_components/OrdersStatusSummary";
import {
  type OrdersFilterState,
  parseOrdersSearchParams,
  toOrdersListQuery,
  updateOrdersSearchParams,
} from "./_lib/search-params";

/**
 * 마이페이지 진입 화면(Figma MY-1, `/mypage/orders`) — 주문 상태 요약 + 기간·상태·장인 이름
 * 필터 + 주문 목록. 인증 데이터라 서버 프리페치는 하지 않는다(`AddressesTab`과 동일 패턴 —
 * SSR엔 접근 토큰이 없다). 필터 변경은 `products` 목록과 동일하게 shallow
 * `history.pushState`로 URL만 갱신한다(design.md §6.4).
 */
export default function MypageOrdersPage() {
  const searchParams = useSearchParams();
  const filterState = parseOrdersSearchParams(
    new URLSearchParams(searchParams.toString()),
  );

  const summaryQuery = useOrderStatusSummaryQuery();
  const listQuery = useOrdersListQuery(toOrdersListQuery(filterState));

  function updateUrl(patch: Partial<OrdersFilterState>) {
    const params = updateOrdersSearchParams(
      new URLSearchParams(window.location.search),
      patch,
    );
    window.history.pushState(
      null,
      "",
      `/mypage/orders${params.size ? `?${params}` : ""}`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <OrdersStatusSummary
        data={summaryQuery.data}
        isPending={summaryQuery.isPending}
        hasError={summaryQuery.isError}
        onRetry={() => void summaryQuery.refetch()}
      />
      <OrdersFilterBar
        period={filterState.period}
        from={filterState.from}
        to={filterState.to}
        status={filterState.status}
        artisanName={filterState.artisanName}
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
