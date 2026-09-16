import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ProductDetailGallery } from "./ProductDetailGallery";

const images = [
  { src: "/first.png", alt: "작품 정면" },
  { src: "/second.png", alt: "작품 측면" },
];

describe("ProductDetailGallery", () => {
  it("썸네일 선택을 확대 화면에 반영하고 키보드 이동을 양 끝에서 멈춘다", async () => {
    const user = userEvent.setup();
    render(<ProductDetailGallery images={images} productName="나전함" />);
    await user.click(screen.getByRole("button", { name: "2번 이미지 보기" }));
    const trigger = screen.getByRole("button", { name: "나전함 이미지 확대" });
    expect(within(trigger).getByRole("img")).toHaveAttribute(
      "src",
      "/second.png",
    );
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "상품 이미지 확대" });
    expect(
      within(dialog).getByRole("button", { name: "다음 이미지" }),
    ).toBeDisabled();
    await user.keyboard("{ArrowLeft}");
    expect(
      within(dialog).getByRole("button", { name: "이전 이미지" }),
    ).toBeDisabled();
    await user.keyboard("{ArrowLeft}");
    expect(within(dialog).getByText("1 / 2")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("이미지가 없거나 로드가 실패해도 안내를 제공한다", () => {
    const { rerender } = render(
      <ProductDetailGallery images={[]} productName="나전함" />,
    );
    expect(
      screen.getByRole("img", { name: "나전함 이미지 준비 중" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "나전함 이미지 확대" }),
    ).not.toBeInTheDocument();
    rerender(<ProductDetailGallery images={images} productName="나전함" />);
    fireEvent.error(
      within(
        screen.getByRole("button", { name: "나전함 이미지 확대" }),
      ).getByRole("img"),
    );
    expect(
      screen.getByRole("img", {
        name: "작품 정면 — 이미지를 불러올 수 없습니다",
      }),
    ).toBeInTheDocument();
  });

  it("대표 이미지 탐색은 최대 6개로 제한한다", () => {
    render(
      <ProductDetailGallery
        images={Array.from({ length: 8 }, (_, index) => ({
          src: `/image-${index}.png`,
          alt: `작품 ${index + 1}`,
        }))}
        productName="나전함"
      />,
    );
    expect(
      screen.getAllByRole("button", { name: /번 이미지 보기/ }),
    ).toHaveLength(6);
    expect(
      screen.queryByRole("button", { name: "7번 이미지 보기" }),
    ).not.toBeInTheDocument();
  });

  it("확대 이미지 바깥의 빈 배경을 누르면 닫고 이미지 클릭은 유지한다", async () => {
    const user = userEvent.setup();
    render(<ProductDetailGallery images={images} productName="나전함" />);
    const trigger = screen.getByRole("button", { name: "나전함 이미지 확대" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "상품 이미지 확대" });
    await user.click(within(dialog).getByRole("img", { name: "작품 정면" }));
    expect(dialog).toBeInTheDocument();
    await user.click(dialog);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
});
