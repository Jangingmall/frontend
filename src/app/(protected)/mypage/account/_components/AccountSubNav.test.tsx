import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountSubNav } from "./AccountSubNav";

describe("AccountSubNav", () => {
  it("로컬 계정은 '비밀번호 변경' 항목을 보여준다", () => {
    render(<AccountSubNav activeTab="info" authProvider="local" />);

    expect(
      screen.getByRole("link", { name: "비밀번호 변경" }),
    ).toBeInTheDocument();
  });

  it("소셜 계정은 '비밀번호 변경' 항목을 숨긴다", () => {
    render(<AccountSubNav activeTab="info" authProvider="kakao" />);

    expect(
      screen.queryByRole("link", { name: "비밀번호 변경" }),
    ).not.toBeInTheDocument();
  });
});
