import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypageSettingsPage from "./page";

describe("MypageSettingsPage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypageSettingsPage />);

    expect(screen.getByText("설정 기능은 준비 중입니다")).toBeInTheDocument();
  });
});
