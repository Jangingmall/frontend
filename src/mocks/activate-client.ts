/** MSW 2의 활성 클라이언트 목록은 워커가 유휴 종료되면 사라진다. 요청 전에 재등록한다. */
export function activateMockClient(): Promise<void> {
  const serviceWorker = navigator.serviceWorker;
  const controller = serviceWorker?.controller;
  if (!controller)
    return Promise.reject(
      new Error("시연 연결이 끊겼습니다. 페이지를 새로고침해 주세요."),
    );
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      serviceWorker.removeEventListener("message", onMessage);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== controller || event.data?.type !== "MOCKING_ENABLED")
        return;
      cleanup();
      resolve();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "시연 연결을 확인하지 못했습니다. 페이지를 새로고침해 주세요.",
        ),
      );
    }, 5000);
    serviceWorker.addEventListener("message", onMessage);
    try {
      controller.postMessage("MOCK_ACTIVATE");
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
