import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "./error-state";

describe("ErrorState", () => {
  it("role=alert 컨테이너로 렌더한다", () => {
    render(<ErrorState />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("알려진 code에 매핑된 문구를 보여준다", () => {
    render(<ErrorState code="NOT_FOUND" />);

    expect(
      screen.getByText("요청한 정보를 찾을 수 없어요."),
    ).toBeInTheDocument();
  });

  it("code가 unknown이면 status로, 둘 다 없으면 GENERIC으로 떨어진다", () => {
    const { rerender } = render(<ErrorState code="UNKNOWN" status={404} />);
    expect(
      screen.getByText("요청한 정보를 찾을 수 없어요."),
    ).toBeInTheDocument();

    rerender(<ErrorState />);
    expect(
      screen.getByText("요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
  });

  it("description을 넘기면 매핑 문구 대신 그걸 보여준다", () => {
    render(
      <ErrorState code="NOT_FOUND" description="상품을 찾을 수 없어요." />,
    );

    expect(screen.getByText("상품을 찾을 수 없어요.")).toBeInTheDocument();
    expect(
      screen.queryByText("요청한 정보를 찾을 수 없어요."),
    ).not.toBeInTheDocument();
  });

  it("onRetry가 있으면 재시도 버튼이 뜨고 클릭 시 호출된다", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("onRetry가 없으면 재시도 버튼을 렌더하지 않는다", () => {
    render(<ErrorState />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
