import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import type { ChatMessage } from "@/types/chatbot";

import { ChatPanel } from "./ChatPanel";

const meta = {
  title: "Chatbot/ChatPanel",
  component: ChatPanel,
  parameters: { layout: "fullscreen" },
  args: {
    isSending: false,
    sendError: false,
    onRetry: () => {},
    onSend: () => {},
    onSuggestionClick: () => {},
    onReshuffleSuggestions: () => {},
    onCollapse: () => {},
    onRequestClose: () => {},
  },
  decorators: [
    (Story) => (
      <div className="relative h-150 bg-fill-neutral-weak">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SUGGESTIONS = [
  "외국 친구에게 선물할 기념품 추천",
  "집들이 선물에 어울리는 전통 다기 세트 추천",
  "한지로 만든 수첩 추천",
  "30만원 이하의 금속 공예품 추천",
];

function Interactive() {
  const [value, setValue] = useState("");
  return (
    <ChatPanel
      messages={[]}
      isSending={false}
      sendError={false}
      onRetry={() => {}}
      inputValue={value}
      onInputChange={setValue}
      onSend={() => setValue("")}
      suggestions={SUGGESTIONS}
      onSuggestionClick={() => {}}
      onReshuffleSuggestions={() => {}}
      onCollapse={() => {}}
      onRequestClose={() => {}}
    />
  );
}

/** 빈 상태 — 인사 버블 + 추천 칩 4개 + "다른 질문 보기". */
export const Empty: Story = {
  args: {
    messages: [],
    inputValue: "",
    onInputChange: () => {},
    suggestions: SUGGESTIONS,
  },
  render: () => <Interactive />,
};

/** 대화 중 + 추천 상품 카드 포함 봇 응답. */
export const WithConversation: Story = {
  args: {
    messages: [
      {
        id: 1,
        sessionId: "s",
        sender: "user",
        content: "셰프인 친구 개업 선물로 15만원 이하의 축하 선물이 필요해.",
        sentAt: new Date().toISOString(),
      },
      {
        id: 2,
        sessionId: "s",
        sender: "bot",
        content: "셰프에게 선물하기 적합한 상품을 몇 가지 골라봤어요.",
        sentAt: new Date().toISOString(),
      },
    ] satisfies ChatMessage[],
    inputValue: "",
    onInputChange: () => {},
    suggestions: SUGGESTIONS,
  },
};

/** 봇 응답을 기다리는 중 — 생각 하는 중 버블. */
export const Sending: Story = {
  args: {
    messages: [
      {
        id: 1,
        sessionId: "s",
        sender: "user",
        content: "한지로 만든 수첩 추천",
        sentAt: new Date().toISOString(),
      },
    ] satisfies ChatMessage[],
    isSending: true,
    inputValue: "",
    onInputChange: () => {},
    suggestions: SUGGESTIONS,
  },
};

/** 메시지 전송 실패 — 입력창 위 인라인 오류 배너 + 다시 시도. */
export const SendError: Story = {
  args: {
    messages: [
      {
        id: 1,
        sessionId: "s",
        sender: "user",
        content: "한지로 만든 수첩 추천",
        sentAt: new Date().toISOString(),
      },
    ] satisfies ChatMessage[],
    sendError: true,
    inputValue: "",
    onInputChange: () => {},
    suggestions: SUGGESTIONS,
  },
};
