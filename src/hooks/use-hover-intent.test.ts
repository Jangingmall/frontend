import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHoverIntent } from "./use-hover-intent";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useHoverIntent", () => {
  it("scheduleOpen은 openDelayMs 후에만 onOpenChange(true)를 부른다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: false, onOpenChange }),
    );

    act(() => result.current.scheduleOpen());
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(149));
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("scheduleClose는 closeDelayMs 후에만 onOpenChange(false)를 부른다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: true, onOpenChange }),
    );

    act(() => result.current.scheduleClose());
    act(() => vi.advanceTimersByTime(299));
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("cancelScheduledClose를 부르면 예약된 닫기가 실행되지 않는다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: true, onOpenChange }),
    );

    act(() => result.current.scheduleClose());
    act(() => result.current.cancelScheduledClose());
    act(() => vi.advanceTimersByTime(500));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("open()은 디바운스 없이 즉시 onOpenChange(true)를 부른다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: false, onOpenChange }),
    );

    act(() => result.current.open());

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("close()는 디바운스 없이 즉시 onOpenChange(false)를 부른다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: true, onOpenChange }),
    );

    act(() => result.current.close());

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it("이미 열려 있으면 scheduleOpen을 불러도 다시 알리지 않는다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: true, onOpenChange }),
    );

    act(() => result.current.scheduleOpen());
    act(() => vi.advanceTimersByTime(150));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("이미 닫혀 있으면 scheduleClose를 불러도 다시 알리지 않는다", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: false, onOpenChange }),
    );

    act(() => result.current.scheduleClose());
    act(() => vi.advanceTimersByTime(300));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("open()이 예약된 닫기를 취소한다(트리거→패널 이동 중 재진입)", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() =>
      useHoverIntent({ isOpen: true, onOpenChange }),
    );

    act(() => result.current.scheduleClose());
    act(() => result.current.open());
    act(() => vi.advanceTimersByTime(300));

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
