"use client"; // Error boundary는 Client Component여야 한다

/**
 * 루트 layout 자체가 깨졌을 때(프로바이더·폰트 로딩 실패 등)의 최후 fallback.
 * (docs/ui-system.md §7.4)
 *
 * 루트 layout을 대체해 렌더되므로 폰트·전역 스타일·디자인 토큰(`globals.css`)을 신뢰할 수
 * 없다 — `ErrorState`를 재사용하지 않고 자체 `<html><body>` + 최소 인라인 마크업만 둔다.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          <p>문제가 발생했어요. 잠시 후 다시 시도해 주세요.</p>
          <button type="button" onClick={() => retry()}>
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
