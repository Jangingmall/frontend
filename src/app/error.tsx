"use client"; // Error boundary는 Client Component여야 한다

import { useEffect } from "react";

import { ErrorState } from "@/components/common/error-state";

/**
 * 전역 렌더 오류 fallback. (docs/ui-system.md §7.4)
 *
 * REST 요청 실패·입력 검증 실패·404·권한 부족처럼 예상 가능한 상태는 이 파일의 책임이 아니다
 * (`ErrorState`를 각 화면이 인라인으로 재사용). 여기는 예기치 않은 렌더 오류만 잡는다.
 * `error.message`는 prod에서 서버 컴포넌트발 오류일 경우 민감정보 보호를 위해 일반화되므로
 * 화면에 그대로 노출하지 않는다 — GENERIC 문구만 보여준다. 콘솔 로깅은 지금은 `console.error`뿐
 * (에러 리포팅 도구 선정 전 — docs/data-layer.md §5.2·§10).
 *
 * `retry`는 Next 16.3부터 stable — 세그먼트를 다시 fetch·렌더한다(`reset`은 상태만 지움).
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <ErrorState onRetry={retry} />
    </div>
  );
}
