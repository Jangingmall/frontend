import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MypagePage from "./page";

describe("MypagePage", () => {
  it("준비 중 안내를 보여준다", () => {
    render(<MypagePage />);

    expect(
      screen.getByText("마이페이지 대시보드는 준비 중입니다"),
    ).toBeInTheDocument();
  });
});
