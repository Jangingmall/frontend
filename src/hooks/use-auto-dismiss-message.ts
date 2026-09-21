"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoDismissMessageResult {
  message: string | null;
  /** 새 메시지를 띄운다 — 이전 타이머가 남아 있으면 먼저 취소해, 빠른 연속 호출에서
   * 새 메시지가 이전 타이머에 조기 종료되지 않게 한다. */
  show: (message: string) => void;
}

/**
 * 몇 초 후 자동으로 사라지는 안내(토스트 등) 상태. `window.setTimeout`을 직접 여러 곳에서
 * 걸면 연속 호출 시 이전 타이머가 새 메시지를 조기에 닫고, 언마운트 후에도 setState가
 * 실행될 수 있다(Codex 리뷰 F2, T-20) — 이 훅이 타이머 하나만 유지하며 정리한다.
 */
export function useAutoDismissMessage(
  durationMs = 3000,
): UseAutoDismissMessageResult {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(
    (next: string) => {
      clear();
      setMessage(next);
      timer.current = setTimeout(() => {
        timer.current = null;
        setMessage(null);
      }, durationMs);
    },
    [clear, durationMs],
  );

  useEffect(() => clear, [clear]);

  return { message, show };
}
