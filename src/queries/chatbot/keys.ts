export const chatbotKeys = {
  all: ["chatbot"] as const,
  // `userId`를 포함한다 — `QueryProvider`가 루트 레이아웃에 있어 QueryClient가 브라우저
  // 세션 내내 유지되므로, sessionId만으로 키를 만들면 계정을 바꿔도(로그아웃→다른
  // 계정 로그인) 이전 계정의 검증 성공 캐시를 그대로 재사용해버린다(리뷰 지적).
  history: (sessionId: string, userId: number | null) =>
    [...chatbotKeys.all, "history", userId, sessionId] as const,
};
