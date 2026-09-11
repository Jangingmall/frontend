import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "./error";

describe("ErrorPage", () => {
  it("ErrorState를 렌더하고 콘솔에 로깅한다", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = Object.assign(new Error("boom"), { digest: "abc" });

    render(<ErrorPage error={error} retry={vi.fn()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it("재시도 클릭 시 retry를 호출한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const retry = vi.fn();

    render(<ErrorPage error={new Error("boom")} retry={retry} />);
    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(retry).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });
});
