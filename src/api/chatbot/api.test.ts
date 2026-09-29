import { beforeEach, describe, expect, it } from "vitest";

import {
  createChatSession,
  endChatSession,
  fetchChatHistory,
  sendChatMessage,
} from "./api";
import { CHAT_SESSIONS } from "./mock/fixtures";

describe("챗봇", () => {
  beforeEach(() => {
    CHAT_SESSIONS.clear();
  });

  it("세션을 생성한다", async () => {
    const session = await createChatSession();
    expect(session.sessionId).toBeTruthy();
    expect(session.expiresInSeconds).toBe(3600);
  });

  it("메시지를 보내면 봇 답변이 온다", async () => {
    const session = await createChatSession();
    const reply = await sendChatMessage(session.sessionId, "안녕");
    expect(reply.sender).toBe("bot");
    expect(reply.content).toBeTruthy();
  });

  it("'선물'·'추천'이 포함되면 추천 상품이 함께 온다", async () => {
    const session = await createChatSession();
    const reply = await sendChatMessage(
      session.sessionId,
      "친구 선물 추천해줘",
    );
    expect(reply.products?.length).toBeGreaterThan(0);
    expect(reply.products?.[0]?.reason).toBeTruthy();
  });

  it("존재하지 않는 세션에 메시지를 보내면 실패한다", async () => {
    await expect(sendChatMessage("존재하지-않음", "안녕")).rejects.toThrow();
  });

  it("히스토리는 주고받은 메시지를 순서대로 담는다", async () => {
    const session = await createChatSession();
    await sendChatMessage(session.sessionId, "안녕");
    const history = await fetchChatHistory(session.sessionId);
    expect(history).toHaveLength(2);
    expect(history[0]?.sender).toBe("user");
    expect(history[1]?.sender).toBe("bot");
  });

  it("세션을 종료하면 이후 메시지 전송이 실패한다", async () => {
    const session = await createChatSession();
    await endChatSession(session.sessionId);
    await expect(sendChatMessage(session.sessionId, "안녕")).rejects.toThrow();
  });

  it("세션을 종료하면 이후 히스토리 조회도 실패한다", async () => {
    const session = await createChatSession();
    await endChatSession(session.sessionId);
    await expect(fetchChatHistory(session.sessionId)).rejects.toThrow();
  });
});
