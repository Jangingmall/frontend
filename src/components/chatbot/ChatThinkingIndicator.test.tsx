import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { ChatThinkingIndicator } from "./ChatThinkingIndicator";

it("기본 챗봇 대기 표시의 안내 문구를 유지한다", () => {
  render(<ChatThinkingIndicator />);
  expect(
    screen.getByRole("status", { name: "생각 하는 중" }),
  ).toHaveTextContent("생각 하는 중...");
});

it("점만 표시하는 생성 화면에서도 접근 가능한 대기 상태를 제공한다", () => {
  render(<ChatThinkingIndicator variant="dots" />);
  expect(
    screen.getByRole("status", { name: "생각 하는 중" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("생각 하는 중...")).not.toBeInTheDocument();
});
