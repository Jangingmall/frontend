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
import { cn } from "@/lib/utils";

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

/**
 * 필터 칩(기간 프리셋·주문 처리 상태 공용) 클래스 — `get_design_context`(node `1271:52687`)
 * 실측: 높이 36px·`rounded-[2px]`·최소폭 72px, 선택 시 14px bold(흰 글자+검정 배경)로
 * 폰트까지 바뀐다(미선택은 13px). `Button`의 `size="xs"`(28px/text-body-m)는 이 칩엔 안 맞아
 * className으로 덮어쓴다.
 */
function chipClassName(selected: boolean) {
  return cn(
    "h-9 min-w-18 rounded-[2px]",
    selected ? "text-body-m font-bold" : "text-body-s",
  );
}

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
    <div className="flex flex-col gap-2 p-3">
      <SearchField
        // `artisanName`이 바뀔 때만 리마운트해 `defaultValue`를 다시 적용한다 —
        // `SearchField`는 비제어 컴포넌트라 URL 뒤로가기 등으로 prop이 외부에서 바뀌어도
        // 리렌더링만으로는 입력창에 반영되지 않는다(Codex 리뷰 F2).
        key={artisanName}
        defaultValue={artisanName}
        onSearch={onSearch}
        aria-label="장인 이름 검색"
        placeholder="검색어를 입력해주세요."
      />

      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 text-body-s text-font-dark">
          검색 기간
        </span>
        <div role="group" aria-label="검색 기간" className="flex gap-1">
          {PERIOD_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={period === preset ? "solid" : "outline"}
              size="xs"
              aria-pressed={period === preset}
              onClick={() => onPeriodChange(preset)}
              className={chipClassName(period === preset)}
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
        <span className="w-20 shrink-0 text-body-s text-font-dark">
          주문 처리 상태
        </span>
        <div
          role="group"
          aria-label="주문 처리 상태"
          className="flex flex-wrap gap-1"
        >
          {ORDER_STATUS_FILTER_TABS.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={status === tab.key ? "solid" : "outline"}
              size="xs"
              aria-pressed={status === tab.key}
              onClick={() => onStatusChange(tab.key)}
              className={chipClassName(status === tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <ul className="list-disc space-y-1 py-2 pl-5 text-caption text-font-label">
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
