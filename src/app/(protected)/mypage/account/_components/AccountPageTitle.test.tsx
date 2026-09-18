import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AccountPageTitle } from "./AccountPageTitle";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("AccountPageTitle", () => {
  it("뒤로가기 아이콘을 누르면 /mypage로 이동한다", async () => {
    const user = userEvent.setup();
    render(<AccountPageTitle />);

    await user.click(
      screen.getByRole("button", { name: "마이페이지로 돌아가기" }),
    );

    expect(push).toHaveBeenCalledWith("/mypage");
  });
});
