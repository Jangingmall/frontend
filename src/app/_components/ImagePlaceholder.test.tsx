import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImagePlaceholder } from "./ImagePlaceholder";

describe("ImagePlaceholder", () => {
  it("보조기술에서 숨기고 전달된 className을 합친다", () => {
    const { container } = render(
      <ImagePlaceholder className="aspect-square" />,
    );
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("aspect-square");
    expect(el).toHaveClass("bg-bg-skeleton");
  });
});
