import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("title을 렌더한다", () => {
    render(<EmptyState title="찜한 상품이 없어요" />);

    expect(screen.getByText("찜한 상품이 없어요")).toBeInTheDocument();
  });

  it("description·icon·action을 넘기면 함께 렌더한다", () => {
    render(
      <EmptyState
        title="찜한 상품이 없어요"
        description="마음에 드는 상품을 찜해 보세요"
        icon={<span data-testid="empty-icon" />}
        action={<button type="button">쇼핑 계속하기</button>}
      />,
    );

    expect(
      screen.getByText("마음에 드는 상품을 찜해 보세요"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "쇼핑 계속하기" }),
    ).toBeInTheDocument();
  });

  it("description을 안 넘기면 렌더하지 않는다", () => {
    const { container } = render(<EmptyState title="찜한 상품이 없어요" />);

    expect(container.querySelector(".text-body-s")).not.toBeInTheDocument();
  });
});
