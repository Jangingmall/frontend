"use client";

import dayjs from "dayjs";
import { useLayoutEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { OrderExpandToggle } from "@/components/order/OrderExpandToggle";
import { OrderInfoBar } from "@/components/order/OrderInfoBar";
import { OrderProductCard } from "@/components/order/OrderProductCard";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

interface MultiItemOrderCardProps {
  order: OrderGroup;
  orderDate: string;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * 복수 상품 주문 카드 — 접힘(대표 카드 1개) ↔ 펼침(전체 카드) 전환을 `max-height` 트랜지션
 * 으로 부드럽게 넘긴다. 압축 카드 행과 상세 카드 행을 항상 둘 다 DOM에 두고(`inert`/
 * `aria-hidden`로 숨김 쪽을 접근성 트리·포커스에서 제외), 보이는 쪽만 실제 높이까지 연다.
 *
 * 펼침 쪽은 상품 개수에 따라 실제 높이가 달라지므로(CSS는 `auto`/`none` 사이를 트랜지션할
 * 수 없어 숫자 두 값이 필요) `useLayoutEffect`로 `scrollHeight`를 재서 그 값을 max-height로
 * 쓴다 — 상품이 많은 주문이 고정 상한에 잘리는 문제(Codex 리뷰 F3)를 막는다. `scrollHeight`는
 * `max-height`로 잘려 있어도 실제 콘텐츠 높이를 그대로 보고하므로 접힌 상태에서도 잴 수 있다.
 * `grid-template-rows`를 `0fr`↔`1fr`로 트랜지션하는 CSS 그리드 아코디언 기법도 시도했으나,
 * 이 프로젝트 환경에서 두 트랙을 한 grid에 두고 auto-height 부모에서 쓸 때 실제로 반영되지
 * 않는 걸 직접 확인해(inline style·`!important`로 강제해도 계산값이 안 바뀜) 이 방식으로
 * 대체했다.
 */
function MultiItemOrderCard({
  order,
  orderDate,
  isExpanded,
  onToggle,
}: MultiItemOrderCardProps) {
  const detailRef = useRef<HTMLDivElement>(null);
  const [detailHeight, setDetailHeight] = useState(0);

  useLayoutEffect(() => {
    if (detailRef.current) {
      setDetailHeight(detailRef.current.scrollHeight);
    }
  }, [order.items]);

  const representative = order.items[0]!;

  return (
    <div className={ORDER_CARD_CLASS}>
      <OrderInfoBar
        variant="multi"
        itemCount={order.items.length}
        orderNumber={order.orderNumber}
        orderDate={orderDate}
      />
      <div
        data-testid="order-compact-row"
        aria-hidden={isExpanded}
        inert={isExpanded || undefined}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
          isExpanded ? "max-h-0 opacity-0" : "max-h-52 opacity-100",
        )}
      >
        <OrderProductCard
          variant="compact"
          thumbnail={representative.thumbnailUrl}
          productName={representative.productName}
          price={representative.price}
        />
      </div>
      <div
        ref={detailRef}
        data-testid="order-detail-row"
        aria-hidden={!isExpanded}
        inert={!isExpanded || undefined}
        style={{ maxHeight: isExpanded ? detailHeight : 0 }}
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out",
          isExpanded ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex flex-col">
          {order.items.map((item, index) => (
            <OrderProductCard
              key={`${order.orderId}-${index}`}
              variant="detailed"
              thumbnail={item.thumbnailUrl}
              productName={item.productName}
              price={item.price}
              status={item.status}
              showStatusBadge
            />
          ))}
        </div>
      </div>
      <div className="px-3 pb-3">
        <OrderExpandToggle
          itemCount={order.items.length}
          isExpanded={isExpanded}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}

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

  return (
    <div aria-busy={isFetching} className="flex flex-col gap-4">
      {!data.items.length && (
        // 페이지네이션은 아래에서 항상 별도로 그린다 — 이번 페이지가 우연히 전부 걸러진
        // 주문(예: 결제 실패)으로 채워졌을 때도 다른 페이지로 이동할 수 있어야 한다
        // (Codex 리뷰 F1).
        <EmptyState
          title="조건에 맞는 주문이 없어요"
          description="다른 조건으로 다시 찾아보세요."
        />
      )}
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
                thumbnail={item.thumbnailUrl}
                productName={item.productName}
                price={item.price}
                status={item.status}
                showStatusBadge={false}
              />
            </div>
          );
        }

        return (
          <MultiItemOrderCard
            key={order.orderId}
            order={order}
            orderDate={orderDate}
            isExpanded={isExpanded}
            onToggle={() => toggle(order.orderId)}
          />
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
