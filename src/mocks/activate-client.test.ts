import { afterEach, expect, it, vi } from "vitest";

import { activateMockClient } from "./activate-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("유휴 종료 후에도 활성 확인 응답을 받아야 요청을 진행한다", async () => {
  const events = new EventTarget();
  const controller = { postMessage: vi.fn() };
  vi.stubGlobal("navigator", {
    serviceWorker: Object.assign(events, { controller }),
  });
  let ready = false;
  const pending = activateMockClient().then(() => {
    ready = true;
  });
  await Promise.resolve();
  expect(ready).toBe(false);
  expect(controller.postMessage).toHaveBeenCalledWith("MOCK_ACTIVATE");
  const event = new MessageEvent("message", {
    data: { type: "MOCKING_ENABLED" },
  });
  Object.defineProperty(event, "source", { value: controller });
  events.dispatchEvent(event);
  await pending;
  expect(ready).toBe(true);
});

it("워커 연결이 없으면 네트워크 요청을 진행하지 않는다", async () => {
  vi.stubGlobal("navigator", { serviceWorker: { controller: null } });
  await expect(activateMockClient()).rejects.toThrow("시연 연결이 끊겼습니다");
});

it("워커가 응답하지 않으면 시간 제한 후 실패한다", async () => {
  vi.useFakeTimers();
  const events = new EventTarget();
  vi.stubGlobal("navigator", {
    serviceWorker: Object.assign(events, {
      controller: { postMessage: vi.fn() },
    }),
  });
  const result =
    expect(activateMockClient()).rejects.toThrow(
      "시연 연결을 확인하지 못했습니다",
    );
  await vi.advanceTimersByTimeAsync(5000);
  await result;
});
