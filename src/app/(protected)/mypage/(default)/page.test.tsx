import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));

import MypagePage from "./page";

describe("MypagePage", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("진입하면 주문 및 배송 화면으로 이동한다", () => {
    MypagePage();

    expect(redirect).toHaveBeenCalledWith("/mypage/orders");
  });
});
