import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProviderBadge } from "./ProviderBadge";

describe("ProviderBadge", () => {
  it("circle variant는 연동됨 라벨을 접근성 이름으로 노출한다", () => {
    render(<ProviderBadge provider="naver" variant="circle" />);

    expect(
      screen.getByRole("img", { name: "네이버 계정 연동됨" }),
    ).toBeInTheDocument();
  });

  it("pill variant는 제공자 이름과 함께 연동 문구를 보여준다", () => {
    render(<ProviderBadge provider="kakao" variant="pill" />);

    expect(screen.getByText("카카오 계정 연동계정")).toBeInTheDocument();
  });
});
