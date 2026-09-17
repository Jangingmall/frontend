import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderExpandToggle } from "./OrderExpandToggle";

describe("OrderExpandToggle", () => {
  it("itemCount가 텍스트에 반영된다", () => {
    render(
      <OrderExpandToggle
        itemCount={3}
        isExpanded={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText(/총 3건 주문 펼쳐보기/)).toBeInTheDocument();
  });

  it("isExpanded에 따라 aria-expanded가 바뀐다", () => {
    const { rerender } = render(
      <OrderExpandToggle
        itemCount={2}
        isExpanded={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    rerender(
      <OrderExpandToggle itemCount={2} isExpanded onToggle={() => {}} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("클릭 시 onToggle을 호출한다", () => {
    const onToggle = vi.fn();
    render(
      <OrderExpandToggle
        itemCount={2}
        isExpanded={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
