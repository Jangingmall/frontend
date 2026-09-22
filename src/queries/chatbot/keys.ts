export const chatbotKeys = {
  all: ["chatbot"] as const,
  history: (sessionId: string) =>
    [...chatbotKeys.all, "history", sessionId] as const,
};
