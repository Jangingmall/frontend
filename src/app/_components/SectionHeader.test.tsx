import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  it("제목·설명을 보여주고 전체보기는 실제 링크로 이동한다", () => {
    render(
      <SectionHeader
        title="베스트"
        description="최근 4주 판매·조회 기준"
        viewAll={{ href: { pathname: "/products", query: { preset: "best" } } }}
      />,
    );
    expect(screen.getByRole("heading", { name: "베스트" })).toBeInTheDocument();
    expect(screen.getByText("최근 4주 판매·조회 기준")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체보기" })).toHaveAttribute(
      "href",
      "/products?preset=best",
    );
  });

  it("viewAll이 disabled면 링크 없이 비활성 상태로 보여준다", () => {
    render(
      <SectionHeader
        title="장인관"
        description="한 사람의 작업을 처음부터 끝까지 들여다봅니다"
        viewAll={{ disabled: true }}
      />,
    );
    expect(
      screen.queryByRole("link", { name: "전체보기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("전체보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
