import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";

import { CartProductCard } from "./CartProductCard";

it("displays the resolved URL when cart variants are empty", () => {
  render(
    <CartProductCard
      line={{
        ...cartFixtures.base[0],
        thumbnail: { imageId: "empty", variants: [] },
        thumbnailUrl: "/resolved.jpg",
      }}
      onSelect={vi.fn()}
      onQuantity={vi.fn()}
      onDelete={vi.fn()}
      onOptions={vi.fn()}
    />,
  );
  expect(screen.getByRole("presentation")).toHaveAttribute(
    "src",
    expect.stringContaining("/resolved.jpg"),
  );
});
