import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "./not-found";

describe("NotFound", () => {
  it("안내 문구와 홈 링크를 렌더한다", () => {
    render(<NotFound />);

    expect(screen.getByText("페이지를 찾을 수 없어요")).toBeInTheDocument();
    const homeLink = screen.getByRole("link", { name: "홈으로" });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
