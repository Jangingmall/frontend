import dayjs from "dayjs";

import type { OrdersListQuery } from "@/api/orders/query";
import {
  ORDER_PERIOD_PRESET,
  ORDER_STATUS_GROUP,
  type OrderPeriodPreset,
  type OrderStatusGroupKey,
  resolveOrderPeriod,
} from "@/constants/order";

/**
 * 화면(URL) 필터 상태. `period`는 어떤 프리셋 버튼이 선택돼 보이는지(시각용)만 담당하고,
 * 실제 유효 범위는 항상 `from`/`to`에 확정돼 있다 — 프리셋을 고르든 날짜를 직접 편집하든
 * 이 둘을 함께 갱신한다(design.md §3 "프리셋 ↔ 커스텀 상호작용").
 */
export interface OrdersFilterState {
  page: number;
  period: OrderPeriodPreset;
  from: string;
  to: string;
  status: "ALL" | OrderStatusGroupKey;
  artisanName?: string;
}

const PERIOD_VALUES = new Set<string>(Object.values(ORDER_PERIOD_PRESET));
const STATUS_GROUP_KEYS = new Set<string>(Object.keys(ORDER_STATUS_GROUP));

function isPeriodPreset(value: string | null): value is OrderPeriodPreset {
  return value !== null && PERIOD_VALUES.has(value);
}

function isStatusGroupKey(value: string | null): value is OrderStatusGroupKey {
  return value !== null && STATUS_GROUP_KEYS.has(value);
}

/**
 * 엄격한 `YYYY-MM-DD` 형식 + 실존하는 달력 날짜인지 확인한다(예: `2026-02-30`은 정규식은
 * 통과해도 라운드트립 포맷 비교에서 걸러진다). URL은 외부 입력이라 검증 없이 API·달력에
 * 그대로 넘기면 안 된다(Codex 리뷰 F3).
 */
function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = dayjs(value);
  return parsed.isValid() && parsed.format("YYYY-MM-DD") === value;
}

export function parseOrdersSearchParams(
  params: URLSearchParams,
): OrdersFilterState {
  const page = Number(params.get("page"));
  const periodParam = isPeriodPreset(params.get("period"))
    ? (params.get("period") as OrderPeriodPreset)
    : ORDER_PERIOD_PRESET.MONTH_3;
  const from = params.get("from");
  const to = params.get("to");
  const hasValidCustomRange = Boolean(
    from &&
    to &&
    isValidDateString(from) &&
    isValidDateString(to) &&
    from <= to,
  );
  // `period=CUSTOM`인데 범위가 유효하지 않으면(형식 오류·역순 등) 기본 프리셋으로 되돌린다 —
  // 나머지 프리셋은 원래도 from/to가 있으면 그 값을 우선했으므로(유효할 때만) 그대로 둔다.
  const period =
    periodParam === "CUSTOM" && !hasValidCustomRange
      ? ORDER_PERIOD_PRESET.MONTH_3
      : periodParam;
  const range = hasValidCustomRange
    ? { from: from!, to: to! }
    : resolveOrderPeriod(period);
  const statusParam = params.get("status");
  const status: "ALL" | OrderStatusGroupKey =
    statusParam === "ALL"
      ? "ALL"
      : isStatusGroupKey(statusParam)
        ? statusParam
        : "ALL";

  return {
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    period,
    from: range.from,
    to: range.to,
    status,
    artisanName: params.get("artisanName") || undefined,
  };
}

/** 화면 필터 상태 → API 조회 쿼리. `size`는 화면이 고정값을 쓴다(디폴트 10). */
export function toOrdersListQuery(state: OrdersFilterState): OrdersListQuery {
  return {
    page: state.page,
    from: state.from,
    to: state.to,
    status: state.status,
    artisanName: state.artisanName,
  };
}

/**
 * `products`(`app/products/_lib/search-params.ts`)와 같은 패턴 — `patch`에 없는 키는
 * 유지, `page`가 patch에 없으면 필터가 바뀐 것으로 보고 1페이지로 리셋(URL에서 제거),
 * 기본값과 같은 값은 URL을 깨끗하게 유지하기 위해 굳이 남기지 않는다.
 */
export function updateOrdersSearchParams(
  current: URLSearchParams,
  patch: Partial<OrdersFilterState>,
): URLSearchParams {
  const params = new URLSearchParams(current);
  if (!("page" in patch)) params.delete("page");
  for (const [key, value] of Object.entries(patch)) {
    params.delete(key);
    if (value === undefined) continue;
    if (key === "page" && value === 1) continue;
    if (key === "status" && value === "ALL") continue;
    if (key === "period" && value === ORDER_PERIOD_PRESET.MONTH_3) continue;
    params.set(key, String(value));
  }
  return params;
}
