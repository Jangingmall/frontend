"use client";

import { Button } from "@/components/ui/button";
import { DateRangeField } from "@/components/ui/date-range-field";
import { SearchField } from "@/components/ui/search-field";
import {
  ORDER_PERIOD_PRESET,
  ORDER_PERIOD_PRESET_LABEL,
  ORDER_STATUS_FILTER_TABS,
  type OrderPeriodPreset,
  type OrderStatusGroupKey,
} from "@/constants/order";

interface OrdersFilterBarProps {
  period: OrderPeriodPreset;
  from: string;
  to: string;
  status: "ALL" | OrderStatusGroupKey;
  artisanName?: string;
  onPeriodChange: (preset: OrderPeriodPreset) => void;
  onCustomRangeChange: (range: { from: string; to: string }) => void;
  onStatusChange: (status: "ALL" | OrderStatusGroupKey) => void;
  onSearch: (artisanName: string) => void;
}

const PERIOD_PRESETS = Object.values(ORDER_PERIOD_PRESET).filter(
  (preset): preset is Exclude<OrderPeriodPreset, "CUSTOM"> =>
    preset !== "CUSTOM",
);

/** 검색·기간·주문 처리 상태 필터 + 안내 문구(design.md §6.2). */
function OrdersFilterBar({
  period,
  from,
  to,
  status,
  artisanName,
  onPeriodChange,
  onCustomRangeChange,
  onStatusChange,
  onSearch,
}: OrdersFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xs border border-border-neutral-weak p-3">
      <SearchField
        defaultValue={artisanName}
        onSearch={onSearch}
        aria-label="장인 이름 검색"
        placeholder="검색어를 입력해주세요."
      />

      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 text-body-s text-font-dark-secondary">
          검색 기간
        </span>
        <div role="radiogroup" aria-label="검색 기간" className="flex gap-2">
          {PERIOD_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={period === preset ? "solid" : "outline"}
              size="xs"
              role="radio"
              aria-checked={period === preset}
              onClick={() => onPeriodChange(preset)}
            >
              {ORDER_PERIOD_PRESET_LABEL[preset]}
            </Button>
          ))}
        </div>
        <DateRangeField
          from={from}
          to={to}
          onChange={onCustomRangeChange}
          ariaLabel="검색 기간 직접 선택"
          className="ml-auto"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 text-body-s text-font-dark-secondary">
          주문 처리 상태
        </span>
        <div
          role="radiogroup"
          aria-label="주문 처리 상태"
          className="flex flex-wrap gap-2"
        >
          {ORDER_STATUS_FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={status === tab.key ? "solid" : "outline"}
              size="xs"
              role="radio"
              aria-checked={status === tab.key}
              onClick={() => onStatusChange(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <ul className="list-disc space-y-1 pl-5 text-caption text-font-dark-subtle">
        <li>
          주문 번호 / 자세히 보기를 클릭하시면 해당 주문에 대한 상세 내역 확인이
          가능합니다.
        </li>
        <li>취소 / 교환 / 반품 신청은 배송 완료일 기준 7일까지 가능합니다.</li>
        <li>
          주문 상태 및 상품의 사용·훼손 여부에 따라 취소 / 교환 / 반품 신청이
          제한될 수 있습니다.
        </li>
        <li>단순 변심에 의한 교환 / 반품 시 배송비가 발생할 수 있습니다.</li>
      </ul>
    </div>
  );
}

export { OrdersFilterBar };
export type { OrdersFilterBarProps };
