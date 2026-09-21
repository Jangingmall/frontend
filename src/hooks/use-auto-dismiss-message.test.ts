import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoDismissMessage } from "./use-auto-dismiss-message";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutoDismissMessage", () => {
  it("durationMs 후 메시지가 사라진다", () => {
    const { result } = renderHook(() => useAutoDismissMessage(3000));

    act(() => result.current.show("찜 목록에서 삭제되었습니다."));
    expect(result.current.message).toBe("찜 목록에서 삭제되었습니다.");

    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.message).toBe("찜 목록에서 삭제되었습니다.");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBeNull();
  });

  it("타이머가 도는 중 다시 show하면 이전 타이머가 새 메시지를 조기에 닫지 않는다 (Codex 리뷰 F2)", () => {
    const { result } = renderHook(() => useAutoDismissMessage(3000));

    act(() => result.current.show("첫 번째"));
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.show("두 번째"));

    // 첫 타이머가 원래 닫혔을 시점(2000 + 1000 = 3000ms 지점)에도 두 번째 메시지는 유지.
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.message).toBe("두 번째");

    // 두 번째 메시지 자체의 durationMs가 지나야 닫힌다.
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.message).toBeNull();
  });

  it("언마운트 시 남은 타이머를 정리한다", () => {
    const { result, unmount } = renderHook(() => useAutoDismissMessage(3000));
    act(() => result.current.show("메시지"));

    expect(() => {
      unmount();
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });
});
