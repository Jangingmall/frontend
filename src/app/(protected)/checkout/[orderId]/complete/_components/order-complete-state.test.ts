import { describe, expect, it } from "vitest";

import { resolveOrderCompleteOutcome } from "./order-complete-state";

describe("resolveOrderCompleteOutcome", () => {
  it("목업 모드의 고정 주문 ID와 허용된 결과만 완료 상태로 해석한다", () => {
    expect(
      resolveOrderCompleteOutcome("ui-preview-order", "success", true),
    ).toBe("success");
    expect(
      resolveOrderCompleteOutcome("ui-preview-order", "bank-pending", true),
    ).toBe("bank-pending");
    expect(
      resolveOrderCompleteOutcome("ui-preview-order", undefined, true),
    ).toBe("success");
  });

  it("실제 모드와 알 수 없는 주문 또는 실패 결과를 완료 상태로 표시하지 않는다", () => {
    expect(
      resolveOrderCompleteOutcome("ui-preview-order", "success", false),
    ).toBeNull();
    expect(
      resolveOrderCompleteOutcome("real-order", "success", true),
    ).toBeNull();
    expect(
      resolveOrderCompleteOutcome("ui-preview-order", "cancelled", true),
    ).toBeNull();
    expect(
      resolveOrderCompleteOutcome("ui-preview-order", ["success"], true),
    ).toBeNull();
  });
});
