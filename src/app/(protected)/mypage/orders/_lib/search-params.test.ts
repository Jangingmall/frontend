import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import {
  parseOrdersSearchParams,
  toOrdersListQuery,
  updateOrdersSearchParams,
} from "./search-params";

describe("parseOrdersSearchParams", () => {
  it("기본값은 3개월 프리셋(오늘~3개월 전)·전체 상태다", () => {
    const state = parseOrdersSearchParams(new URLSearchParams());
    expect(state.page).toBe(1);
    expect(state.period).toBe("MONTH_3");
    expect(state.status).toBe("ALL");
    expect(state.artisanName).toBeUndefined();
    expect(state.to).toBe(dayjs().format("YYYY-MM-DD"));
    expect(state.from).toBe(dayjs().subtract(3, "month").format("YYYY-MM-DD"));
  });

  it("from/to가 URL에 있으면 period 계산 대신 그대로 쓴다", () => {
    const state = parseOrdersSearchParams(
      new URLSearchParams("period=CUSTOM&from=2026-01-01&to=2026-01-31"),
    );
    expect(state).toMatchObject({
      period: "CUSTOM",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("모르는 status·period 값은 기본값으로 되돌린다", () => {
    const state = parseOrdersSearchParams(
      new URLSearchParams("status=UNKNOWN&period=UNKNOWN"),
    );
    expect(state.status).toBe("ALL");
    expect(state.period).toBe("MONTH_3");
  });

  it("알려진 상태 그룹 키는 그대로 읽는다", () => {
    expect(
      parseOrdersSearchParams(new URLSearchParams("status=SHIPPING")).status,
    ).toBe("SHIPPING");
  });

  it("형식이 잘못된 날짜는 무시하고 기본 프리셋으로 되돌린다(Codex 리뷰 F3)", () => {
    const state = parseOrdersSearchParams(
      new URLSearchParams("period=CUSTOM&from=invalid&to=invalid"),
    );
    expect(state.period).toBe("MONTH_3");
    expect(state.to).toBe(dayjs().format("YYYY-MM-DD"));
    expect(state.from).toBe(dayjs().subtract(3, "month").format("YYYY-MM-DD"));
  });

  it("실존하지 않는 달력 날짜(2월 30일)는 무시한다", () => {
    const state = parseOrdersSearchParams(
      new URLSearchParams("period=CUSTOM&from=2026-02-30&to=2026-03-01"),
    );
    expect(state.period).toBe("MONTH_3");
  });

  it("역순 범위(from > to)는 무시한다", () => {
    const state = parseOrdersSearchParams(
      new URLSearchParams("period=CUSTOM&from=2026-02-10&to=2026-01-01"),
    );
    expect(state.period).toBe("MONTH_3");
  });
});

describe("toOrdersListQuery", () => {
  it("화면 상태를 API 쿼리로 그대로 옮긴다", () => {
    expect(
      toOrdersListQuery({
        page: 2,
        period: "MONTH_3",
        from: "2026-01-01",
        to: "2026-01-31",
        status: "SHIPPING",
        artisanName: "김도예",
      }),
    ).toEqual({
      page: 2,
      from: "2026-01-01",
      to: "2026-01-31",
      status: "SHIPPING",
      artisanName: "김도예",
    });
  });
});

describe("updateOrdersSearchParams", () => {
  it("필터 변경은 페이지를 초기화하고 나머지 조건은 유지한다", () => {
    const current = new URLSearchParams(
      "page=3&status=SHIPPING&artisanName=김도예",
    );
    const params = updateOrdersSearchParams(current, { status: "DELIVERED" });
    expect(params.has("page")).toBe(false);
    expect(params.get("status")).toBe("DELIVERED");
    expect(params.get("artisanName")).toBe("김도예");
  });

  it("페이지 이동은 명시한 페이지를 유지한다", () => {
    const params = updateOrdersSearchParams(new URLSearchParams(), {
      page: 2,
    });
    expect(params.get("page")).toBe("2");
  });

  it("기본값(전체·3개월·1페이지)은 URL에 남기지 않는다", () => {
    const params = updateOrdersSearchParams(new URLSearchParams(), {
      page: 1,
      status: "ALL",
      period: "MONTH_3",
    });
    expect(params.toString()).toBe("");
  });

  it("프리셋 변경은 period·from·to를 함께 갱신한다", () => {
    const params = updateOrdersSearchParams(new URLSearchParams(), {
      period: "WEEK",
      from: "2026-01-01",
      to: "2026-01-08",
    });
    expect(params.get("period")).toBe("WEEK");
    expect(params.get("from")).toBe("2026-01-01");
    expect(params.get("to")).toBe("2026-01-08");
  });
});
