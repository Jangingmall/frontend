import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARTISAN_CAROUSEL_ITEMS } from "@/app/_lib/artisan-carousel-fixtures";

import { ArtisanCarousel } from "./ArtisanCarousel";

describe("ArtisanCarousel", () => {
  it("첫 장과 페이지네이션(1/6)을 보여준다", () => {
    render(<ArtisanCarousel />);
    expect(
      screen.getByRole("heading", { name: ARTISAN_CAROUSEL_ITEMS[0].headline }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      `1 / ${ARTISAN_CAROUSEL_ITEMS.length}`,
    );
  });

  it("다음 화살표를 누르면 다음 장으로, 첫 장에서 이전을 누르면 마지막 장으로 순환한다", () => {
    render(<ArtisanCarousel />);
    fireEvent.click(screen.getByRole("button", { name: "다음 장인" }));
    expect(
      screen.getByRole("heading", { name: ARTISAN_CAROUSEL_ITEMS[1].headline }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "이전 장인" }));
    fireEvent.click(screen.getByRole("button", { name: "이전 장인" }));
    expect(
      screen.getByRole("heading", {
        name: ARTISAN_CAROUSEL_ITEMS[ARTISAN_CAROUSEL_ITEMS.length - 1]
          .headline,
      }),
    ).toBeInTheDocument();
  });

  it("전체보기·장인관 둘러보기는 실제 링크가 없다", () => {
    render(<ArtisanCarousel />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText("전체보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("장인관 둘러보기")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
