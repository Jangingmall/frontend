import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { StudioHelp } from "./StudioHelp";

it("도움말을 닫고 다시 열어 튜토리얼을 끝낼 수 있다", () => {
  render(<StudioHelp />);
  expect(
    screen.getByRole("heading", { name: "처음 사용하시나요?" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
  expect(
    screen.queryByRole("heading", { name: "처음 사용하시나요?" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "편집 도움말" }));
  fireEvent.click(screen.getByRole("button", { name: "튜토리얼 시작하기" }));
  expect(screen.getByText("글과 사진 편집")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  expect(screen.getByText("저장과 최종 확인")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "완료" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
