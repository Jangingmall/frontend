import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MypageLayout from "./layout";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

describe("MypageLayout", () => {
  it("좌측 내비와 children을 함께 렌더한다", () => {
    usePathname.mockReturnValue("/mypage/account");
    render(
      <MypageLayout>
        <p>콘텐츠</p>
      </MypageLayout>,
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("콘텐츠")).toBeInTheDocument();
  });
});
