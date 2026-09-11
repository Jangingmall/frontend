import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("data-slot을 갖고 aria-hidden 처리된다", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;

    expect(el).toHaveAttribute("data-slot", "skeleton");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("className을 병합한다", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.firstElementChild;

    expect(el).toHaveClass("h-4", "w-20", "animate-pulse", "bg-bg-skeleton");
  });
});
