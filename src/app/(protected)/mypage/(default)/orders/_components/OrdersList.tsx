"use client";

import dayjs from "dayjs";
import { useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { OrderExpandToggle } from "@/components/order/OrderExpandToggle";
import { OrderInfoBar } from "@/components/order/OrderInfoBar";
import { OrderProductCard } from "@/components/order/OrderProductCard";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { Page } from "@/types/api";
import type { OrderGroup } from "@/types/order";

interface OrdersListProps {
  data?: Page<OrderGroup>;
  isPending: boolean;
  isFetching: boolean;
  hasError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

function formatOrderDate(orderedAt: string): string {
  return dayjs(orderedAt).format("YYYY.MM.DD");
}

/**
 * 주문 카드(정보바+상품카드) 바깥 래퍼 — `get_design_context`(node `1271:52718`) 실측:
 * 흰 배경 + `rounded-[4px]` + `shadow-[0px_4px_12px_rgba(0,0,0,0.08)]` + `overflow-clip`
 * (정보바의 각진 모서리를 부모의 둥근 모서리에 맞춰 잘라낸다).
 */
const ORDER_CARD_CLASS =
  "flex flex-col overflow-clip rounded-xs bg-bg-default shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]";

/**
 * 주문 목록 — 단일/다중 상품 그룹 렌더링 + 그룹별 독립 펼침·접힘(design.md §6.3, T-21 §0-1).
 * 액션 버튼(주문 상세보기·주문 취소 등)은 의도적으로 연결하지 않는다 — 이 화면은 조회·필터만
 * 담당하고, 실제 내비게이션·mutation은 후속 작업(주문 상세·취소/교환/환불)이 배선한다.
 */
function OrdersList({
  data,
  isPending,
  isFetching,
  hasError,
  onRetry,
  onPageChange,
}: OrdersListProps) {
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(
    new Set(),
  );

  function toggle(orderId: number) {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  if (hasError) {
    return (
      <ErrorState title="주문 목록을 불러오지 못했어요" onRetry={onRetry} />
    );
  }

  if (isPending || !data) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">주문 목록을 불러오는 중</span>
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (!data.items.length) {
    return (
      <EmptyState
        title="조건에 맞는 주문이 없어요"
        description="다른 조건으로 다시 찾아보세요."
      />
    );
  }

  return (
    <div aria-busy={isFetching} className="flex flex-col gap-4">
      {data.items.map((order) => {
        const orderDate = formatOrderDate(order.orderedAt);
        const isMulti = order.items.length > 1;
        const isExpanded = expandedOrderIds.has(order.orderId);

        if (!isMulti) {
          const item = order.items[0]!;
          return (
            <div key={order.orderId} className={ORDER_CARD_CLASS}>
              <OrderInfoBar
                variant="single"
                status={item.status}
                orderNumber={order.orderNumber}
                orderDate={orderDate}
              />
              <OrderProductCard
                variant="detailed"
                thumbnail={item.thumbnail}
                productName={item.productName}
                price={item.price}
                status={item.status}
                reason={item.reason}
                showStatusBadge={false}
              />
            </div>
          );
        }

        const representative = order.items[0]!;
        return (
          <div key={order.orderId} className={ORDER_CARD_CLASS}>
            <OrderInfoBar
              variant="multi"
              itemCount={order.items.length}
              orderNumber={order.orderNumber}
              orderDate={orderDate}
            />
            {isExpanded ? (
              order.items.map((item, index) => (
                <OrderProductCard
                  key={`${order.orderId}-${index}`}
                  variant="detailed"
                  thumbnail={item.thumbnail}
                  productName={item.productName}
                  price={item.price}
                  status={item.status}
                  reason={item.reason}
                  showStatusBadge
                />
              ))
            ) : (
              <OrderProductCard
                variant="compact"
                thumbnail={representative.thumbnail}
                productName={representative.productName}
                price={representative.price}
              />
            )}
            <div className="px-3 pb-3">
              <OrderExpandToggle
                itemCount={order.items.length}
                isExpanded={isExpanded}
                onToggle={() => toggle(order.orderId)}
              />
            </div>
          </div>
        );
      })}

      <Pagination
        page={data.page}
        pageCount={data.totalPages}
        onPageChange={onPageChange}
        className="justify-center"
      />
    </div>
  );
}

export { OrdersList };
export type { OrdersListProps };
