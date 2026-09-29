import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { ChatMessage } from "@/types/chatbot";

import { ChatMessageBubble } from "./ChatMessageBubble";

const meta = {
  title: "Chatbot/ChatMessageBubble",
  component: ChatMessageBubble,
  args: { onSuggestionClick: () => {} },
  decorators: [
    (Story) => (
      <div className="w-90 bg-fill-neutral-weak p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatMessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

const userMessage: ChatMessage = {
  id: 1,
  sessionId: "session-1",
  sender: "user",
  content: "셰프인 친구 개업 선물로 15만원 이하의 축하 선물이 필요해.",
  sentAt: new Date().toISOString(),
};

const botMessage: ChatMessage = {
  id: 2,
  sessionId: "session-1",
  sender: "bot",
  content:
    "셰프에게 선물하기 적합한 상품으로는 고급 주방용품이 있어요. 특히 고급 요리칼과 같은 용품은 실용적이면서도 특별한 선물이 될 수 있어요.",
  sentAt: new Date().toISOString(),
};

export const User: Story = {
  args: { message: userMessage, isGroupStart: true },
};

export const Bot: Story = {
  args: { message: botMessage, isGroupStart: true },
};

export const BotWithSuggestions: Story = {
  args: {
    message: {
      ...botMessage,
      content:
        "조건에 맞는 상품을 찾지 못했어요. 조건을 바꿔서 다시 찾아볼까요?",
      suggestions: ["질문 추천 1", "질문 추천 2", "질문 추천 3"],
    },
    isGroupStart: true,
  },
};
