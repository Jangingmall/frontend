import { useCallback, useEffect, useRef } from "react";

/**
 * 호버 메가패널류의 열기·닫기 디바운스를 다루는 controlled 훅.
 * (`temp/tasks/T-06-category-mega-panel/design.md` §3.1)
 *
 * Controlled인 이유: 자체 `isOpen` state를 가지면 "다른 확장 패널이 열려서 이 패널이 강제로
 * 닫혀야 하는" 케이스(예: CM-3 검색 패널과의 상호 배타)를 표현할 방법이 없다. 열림 상태의
 * 유일한 소유자는 호출부(`Gnb`)이고, 이 훅은 마우스·키보드 이벤트를 언제 `onOpenChange`로
 * 알릴지만 결정한다. ESC·바깥 클릭 감지는 컨테이너 DOM 구조를 아는 호출부(`GnbNav`)가
 * 담당하고, 이 훅의 `close()`를 호출한다.
 */
interface UseHoverIntentOptions {
  /** 현재 열림 상태. 렌더링엔 안 쓰고, 중복 호출을 막는 가드로만 쓴다. */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 기본 150ms. */
  openDelayMs?: number;
  /** 기본 300ms. */
  closeDelayMs?: number;
}

interface UseHoverIntentResult {
  /** 즉시 열기 (탭 전환·키보드 포커스용, 디바운스 없음). */
  open: () => void;
  /** `openDelayMs` 후 열기. 이미 열려 있거나 예약돼 있으면 무시. */
  scheduleOpen: () => void;
  /** `closeDelayMs` 후 닫기. 이미 닫혀 있거나 예약돼 있으면 무시. */
  scheduleClose: () => void;
  /** 예약된 닫기를 취소한다(트리거→패널 이동 시 마우스가 컨테이너를 안 벗어난 경우). */
  cancelScheduledClose: () => void;
  /** 즉시 닫기 (ESC·바깥 클릭·컨테이너 밖 blur). */
  close: () => void;
}

export function useHoverIntent({
  isOpen,
  onOpenChange,
  openDelayMs = 150,
  closeDelayMs = 300,
}: UseHoverIntentOptions): UseHoverIntentResult {
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 콜백 안에서 stale closure 없이 최신 값을 읽기 위한 ref. 렌더 중 `ref.current` 대입은
  // `react-hooks/refs`가 막아서 effect에서 동기화한다.
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  const clearOpenTimer = useCallback(() => {
    if (openTimer.current !== null) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const open = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    if (!isOpenRef.current) onOpenChangeRef.current(true);
  }, [clearCloseTimer, clearOpenTimer]);

  const close = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    if (isOpenRef.current) onOpenChangeRef.current(false);
  }, [clearCloseTimer, clearOpenTimer]);

  const scheduleOpen = useCallback(() => {
    clearCloseTimer();
    if (isOpenRef.current || openTimer.current !== null) return;
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      onOpenChangeRef.current(true);
    }, openDelayMs);
  }, [clearCloseTimer, openDelayMs]);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    if (!isOpenRef.current || closeTimer.current !== null) return;
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onOpenChangeRef.current(false);
    }, closeDelayMs);
  }, [clearOpenTimer, closeDelayMs]);

  const cancelScheduledClose = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearOpenTimer, clearCloseTimer]);

  return { open, scheduleOpen, scheduleClose, cancelScheduledClose, close };
}
