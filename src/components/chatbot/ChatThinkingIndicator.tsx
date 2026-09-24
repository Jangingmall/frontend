/**
 * 봇이 답변을 만드는 동안 보여주는 "생각 하는 중..." 버블. Figma `AI-thinking`
 * 컴포넌트셋(`1382:1254`)의 점 3개 애니메이션 프레임을 그대로 옮기지 않고, Tailwind
 * `animate-bounce` + 점마다 다른 `animation-delay`로 같은 느낌을 낸다
 * (`docs/architecture.md` §2 "애니메이션은 CSS·Tailwind 전환 우선").
 *
 * 항상 사용자 메시지 바로 다음에 오는 "새 봇 턴의 시작"이라 `ChatMessageBubble`의 봇
 * 버블과 같은 스타일(테두리·라운드 규칙 포함 `rounded-tl-none`)을 그대로 쓴다 —
 * 별도 디자인이 아니라 실제 답변 버블이 올 자리를 그대로 보여주는 placeholder다.
 */
export function ChatThinkingIndicator() {
  return (
    <div
      role="status"
      aria-label="생각 하는 중"
      className="flex w-fit shrink-0 items-center gap-2 self-start rounded-xl rounded-tl-none border border-border-neutral-subtle bg-bg-default px-3 py-2 text-body-s text-font-dark"
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
