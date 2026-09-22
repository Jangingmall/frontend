"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";

import { CancelIcon, RefreshIcon, SendIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chatbot";

import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatThinkingIndicator } from "./ChatThinkingIndicator";

const GREETING =
  "안녕하세요, 미담AI입니다.\n어떤 상품을 찾고 계신가요?\n조건을 알려주시면, 딱 맞는 상품을 찾아드릴게요.";

interface ChatPanelProps {
  messages: ChatMessage[];
  /** true면 목록 맨 아래 `ChatThinkingIndicator` 버블을 보여준다. */
  isSending: boolean;
  /** true면 입력창 위 인라인 오류 배너 + "다시 시도"(Figma "오류" 화면, §0-2). */
  sendError: boolean;
  onRetry: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  /** 빈 상태(메시지 0개) 인사 칩 목록. */
  suggestions: string[];
  /** 인사 칩 + 개별 메시지의 결과 없음 칩 공용 핸들러. */
  onSuggestionClick: (text: string) => void;
  /** "↻ 다른 질문 보기" — 빈 상태에서만 노출. */
  onReshuffleSuggestions: () => void;
  /** 헤더 "X" — 종료 확인 모달을 띄우라는 신호(모달 자체는 호출부가 소유). */
  onRequestClose: () => void;
  className?: string;
}

/**
 * 챗봇 패널 — 전체 높이 우측 도킹(`fixed inset-y-0 right-0`, 호출부가 위치·z-index를
 * 맡긴다). `components/{domain}`은 `api`·`queries`를 직접 참조하지 않는다
 * (`docs/architecture.md` §8.2) — 데이터·핸들러는 전부 props로 받는 순수 프레젠테이션이다.
 */
export function ChatPanel({
  messages,
  isSending,
  sendError,
  onRetry,
  inputValue,
  onInputChange,
  onSend,
  suggestions,
  onSuggestionClick,
  onReshuffleSuggestions,
  onRequestClose,
  className,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isSending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputValue.trim()) return;
    onSend();
  }

  return (
    <div
      data-slot="chat-panel"
      className={cn(
        "fixed inset-y-0 right-0 z-55 flex w-120 flex-col bg-bg-default shadow-nav",
        className,
      )}
    >
      <header className="flex h-18 shrink-0 items-center justify-between border-b border-border-neutral-subtle px-4">
        <span className="text-title-m text-font-dark">미담 AI</span>
        <button
          type="button"
          onClick={onRequestClose}
          aria-label="챗봇 종료"
          className="flex size-8 items-center justify-center text-font-dark [&_path]:fill-current"
        >
          <CancelIcon className="size-4" />
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <div className="w-70 rounded-xl rounded-tl-none bg-bg-default px-3 py-2 text-body-s whitespace-pre-line text-font-dark">
              {GREETING}
            </div>
            <div className="flex w-70 flex-col gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="rounded-xl border border-border-neutral-subtle bg-bg-default px-3 py-2 text-left text-body-s text-font-dark hover:bg-fill-neutral-weak"
                >
                  {suggestion}
                </button>
              ))}
              <button
                type="button"
                onClick={onReshuffleSuggestions}
                className="flex w-fit items-center gap-1 self-center px-2 py-1 text-caption text-font-dark-subtle [&_path]:fill-current"
              >
                <RefreshIcon className="size-3" />
                다른 질문 보기
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isGroupStart={messages[index - 1]?.sender !== message.sender}
              onSuggestionClick={onSuggestionClick}
            />
          ))
        )}
        {isSending && <ChatThinkingIndicator />}
      </div>

      {sendError && (
        <div className="flex items-center justify-between gap-2 border-t border-border-neutral-subtle bg-bg-default px-4 py-2 text-body-s text-font-dark">
          <span>일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-fill-neutral-impact px-3 py-1.5 text-caption-b text-font-white"
          >
            다시 시도
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border-neutral-subtle p-4"
      >
        <div className="flex items-center gap-2 rounded-xl bg-fill-neutral-weak px-3 py-1">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="궁금한 내용을 입력해주세요."
            className="min-w-0 flex-1 bg-transparent py-2 text-body-s text-font-dark outline-none placeholder:text-font-dark-subtle"
          />
          <button
            type="submit"
            aria-label="전송"
            disabled={!inputValue.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-fill-neutral-impact text-font-white disabled:opacity-40 [&_path]:fill-current"
          >
            <SendIcon className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-caption text-font-dark-subtle">
          AI의 답변은 정확하지 않을 수 있습니다.
        </p>
      </form>
    </div>
  );
}
