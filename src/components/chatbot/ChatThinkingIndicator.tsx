/**
 * 봇이 답변을 만드는 동안 보여주는 "생각 하는 중..." 버블. Figma `AI-thinking`
 * 컴포넌트셋(`1382:1254`)의 점 3개 애니메이션 프레임을 그대로 옮기지 않고, Tailwind
 * `animate-bounce` + 점마다 다른 `animation-delay`로 같은 느낌을 낸다
 * (`docs/architecture.md` §2 "애니메이션은 CSS·Tailwind 전환 우선").
 */
export function ChatThinkingIndicator() {
  return (
    <div
      role="status"
      aria-label="생각 하는 중"
      className="flex w-fit items-center gap-2 rounded-xl bg-bg-default px-3 py-2 text-body-s text-font-dark"
    >
      <span className="flex items-center gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-font-dark-subtle [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-font-dark-subtle [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-font-dark-subtle" />
      </span>
      생각 하는 중...
    </div>
  );
}
