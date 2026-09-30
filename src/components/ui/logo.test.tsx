import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logo } from "./logo";

describe("Logo", () => {
  it("장식용 SVG로 스크린리더에서 숨겨지고 색을 currentColor로 받는다", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "currentColor");
  });

  it("className을 덮어쓸 수 있다", () => {
    const { container } = render(<Logo className="h-6" />);
    expect(container.querySelector("svg")).toHaveClass("h-6");
  });
});
