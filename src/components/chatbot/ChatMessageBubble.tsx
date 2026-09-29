import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chatbot";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  /**
   * 같은 `sender`가 바로 앞 메시지와 이어지는 연속 그룹의 시작 버블인지. Figma
   * `message-box` 컴포넌트셋(`1281:1622`)의 실제 `rectangleCornerRadii`를 대조해 확정한
   * 규칙 — 그룹 시작만 "말풍선이 붙는 쪽" 상단 모서리가 각지고(사용자=우측 상단,
   * 봇=좌측 상단), 그 외엔 네 모서리 전부 둥글다. `ChatPanel`이 목록을 순회하며 계산해
   * 내려준다.
   */
  isGroupStart: boolean;
  /** 이 메시지에 딸린 제안 칩(결과 없음 상태, §0-2) 클릭 — 초기 인사 칩과 같은 핸들러. */
  onSuggestionClick: (text: string) => void;
  /** 전송 대기 중엔 칩도 막는다 — 안 그러면 응답 대기 중 세션이 중복 생성될 수 있다. */
  disableSuggestions?: boolean;
}

/**
 * 결과 없음 상태의 후속 질문 칩은 별도 버블이 아니라 **같은 `message-box`
 * 안에 답변 텍스트와 함께** 들어간다(Figma GUI 파일 결과 없음 프레임, 노드
 * `2204:219323` — 버블 하나(`radius=[0,12,12,12]`, `bg-bg-subtle` 아님 흰색)
 * 안에 텍스트 + 칩 프레임이 `gap-3`로 같이 배치돼 있다). 칩 자체는
 * `bg-bg-subtle`/`rounded-xs`(2px)/가운데 정렬 — 인사 칩(`bg-bg-default`/`rounded`)과는
 * 다른 하위 컴포넌트다.
 */

export function ChatMessageBubble({
  message,
  isGroupStart,
  onSuggestionClick,
  disableSuggestions = false,
}: ChatMessageBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-70 flex-col gap-3 rounded-xl border border-border-neutral-subtle px-3 py-2 text-body-s whitespace-pre-line text-font-dark",
          isUser ? "bg-fill-neutral-weak" : "bg-bg-default",
          isGroupStart && (isUser ? "rounded-tr-none" : "rounded-tl-none"),
        )}
      >
        {message.content}
        {!isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-col gap-1">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                disabled={disableSuggestions}
                className="rounded-xs border border-border-neutral-subtle bg-bg-subtle px-3 py-2 text-center text-caption text-font-dark hover:bg-bg-default disabled:opacity-40"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      {!isUser && message.products && message.products.length > 0 && (
        <div className="flex max-w-95 gap-3 overflow-x-auto rounded-xl border border-border-neutral-subtle bg-bg-default p-3 pb-2">
          {message.products.map(({ product, reason }) => (
            <div key={product.id} className="w-40 shrink-0">
              <p className="mb-1 text-caption text-font-dark-subtle">
                {reason}
              </p>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
