import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SettingsToggleRow } from "./SettingsToggleRow";

describe("SettingsToggleRow", () => {
  it("라벨을 보여주고, 클릭하면 반전된 값으로 onCheckedChange를 호출한다", async () => {
    const onCheckedChange = vi.fn();
    render(
      <SettingsToggleRow
        label="다크모드 변경"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    expect(screen.getByText("다크모드 변경")).toBeInTheDocument();

    const toggle = screen.getByRole("switch", { name: "다크모드 변경" });
    await userEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("trailing을 넘기면 우측에 렌더한다", () => {
    render(
      <SettingsToggleRow
        label="마케팅 수신동의"
        checked
        onCheckedChange={vi.fn()}
        trailing="2026.09.09 동의"
      />,
    );

    expect(screen.getByText("2026.09.09 동의")).toBeInTheDocument();
  });

  it("trailing이 없으면 렌더하지 않는다", () => {
    render(
      <SettingsToggleRow
        label="찜 목록 알림"
        checked
        onCheckedChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("switch", { name: "찜 목록 알림" }),
    ).toBeInTheDocument();
  });
});
