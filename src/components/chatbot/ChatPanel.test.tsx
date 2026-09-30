import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "@/types/chatbot";

import { ChatPanel } from "./ChatPanel";

const SUGGESTIONS = [
  "외국 친구에게 선물할 기념품 추천",
  "한지로 만든 수첩 추천",
];

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof ChatPanel>> = {},
) {
  const props = {
    messages: [] as ChatMessage[],
    isSending: false,
    sendError: false,
    onRetry: vi.fn(),
    inputValue: "",
    onInputChange: vi.fn(),
    onSend: vi.fn(),
    suggestions: SUGGESTIONS,
    onSuggestionClick: vi.fn(),
    onReshuffleSuggestions: vi.fn(),
    onRequestClose: vi.fn(),
    ...overrides,
  };
  render(<ChatPanel {...props} />);
  return props;
}

describe("ChatPanel", () => {
  it("모바일에서는 전폭이고 md 이상에서만 480px 폭이다", () => {
    renderPanel();
    const panel = document.querySelector('[data-slot="chat-panel"]');
    expect(panel).toHaveClass("w-full", "md:w-120");
  });

  it("빈 상태에서는 인사 버블 + 추천 칩을 보여준다", () => {
    renderPanel();
    expect(screen.getByText(/안녕하세요, 미담AI입니다/)).toBeInTheDocument();
    for (const suggestion of SUGGESTIONS) {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    }
  });

  it("추천 칩을 클릭하면 onSuggestionClick이 그 문구로 호출된다", () => {
    const props = renderPanel();
    fireEvent.click(screen.getByText(SUGGESTIONS[0]!));
    expect(props.onSuggestionClick).toHaveBeenCalledWith(SUGGESTIONS[0]);
  });

  it("다른 질문 보기를 클릭하면 onReshuffleSuggestions가 호출된다", () => {
    const props = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /다른 질문 보기/ }));
    expect(props.onReshuffleSuggestions).toHaveBeenCalledOnce();
  });

  it("메시지가 있으면 유저/봇을 구분해 렌더한다", () => {
    renderPanel({
      messages: [
        {
          id: 1,
          sessionId: "s",
          sender: "user",
          content: "선물 추천해줘",
          sentAt: new Date().toISOString(),
        },
        {
          id: 2,
          sessionId: "s",
          sender: "bot",
          content: "이런 상품은 어떠세요?",
          sentAt: new Date().toISOString(),
        },
      ],
    });
    expect(screen.getByText("선물 추천해줘")).toBeInTheDocument();
    expect(screen.getByText("이런 상품은 어떠세요?")).toBeInTheDocument();
    // 인사 버블은 첫 메시지를 보낸 뒤에도 대화의 첫 항목으로 남아있는다.
    expect(screen.getByText(/안녕하세요, 미담AI입니다/)).toBeInTheDocument();
    // 예시 칩(빈 상태 전용)만 사라진다.
    expect(
      screen.queryByRole("button", {
        name: /외국 친구에게 선물할 기념품 추천/,
      }),
    ).not.toBeInTheDocument();
  });

  it("추천 상품이 있는 봇 메시지는 상품 카드를 함께 보여준다", () => {
    renderPanel({
      messages: [
        {
          id: 1,
          sessionId: "s",
          sender: "bot",
          content: "이런 상품은 어떠세요?",
          sentAt: new Date().toISOString(),
          products: [
            {
              reason: "예산에 맞아요.",
              product: {
                id: 101,
                name: "백자 달항아리",
                price: 320000,
                thumbnail: null,
                thumbnailUrl: null,
                artisan: { id: 11, name: "김도예" },
                craftCategory: null,
                rating: 4.8,
                reviewCount: null,
                primaryBadge: null,
                isSoldOut: false,
              },
            },
          ],
        },
      ],
    });
    expect(screen.getByText("예산에 맞아요.")).toBeInTheDocument();
    expect(screen.getByText("백자 달항아리")).toBeInTheDocument();
  });

  it("isSending이면 생각 하는 중 버블을 보여준다", () => {
    renderPanel({ isSending: true });
    expect(
      screen.getByRole("status", { name: "생각 하는 중" }),
    ).toBeInTheDocument();
  });

  it("입력 후 전송하면 onSend가 호출된다", () => {
    const props = renderPanel({ inputValue: "안녕" });
    fireEvent.submit(
      screen.getByPlaceholderText("궁금한 내용을 입력해주세요."),
    );
    expect(props.onSend).toHaveBeenCalledOnce();
  });

  it("입력이 비어 있으면 전송 버튼이 비활성화된다", () => {
    renderPanel({ inputValue: "" });
    expect(screen.getByRole("button", { name: "전송" })).toBeDisabled();
  });

  it("sendError면 오류 배너가 뜨고 다시 시도 클릭 시 onRetry가 호출된다", () => {
    const props = renderPanel({ sendError: true });
    expect(
      screen.getByText(
        "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it("헤더 닫기 버튼을 누르면 onRequestClose가 호출된다", () => {
    const props = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "챗봇 종료" }));
    expect(props.onRequestClose).toHaveBeenCalledOnce();
  });
});
