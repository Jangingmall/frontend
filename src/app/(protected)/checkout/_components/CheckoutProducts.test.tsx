import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";

import { CheckoutProducts } from "./CheckoutProducts";

it("displays the resolved URL in checkout product information", () => {
  render(
    <CheckoutProducts
      lines={[
        {
          ...cartFixtures.base[0],
          thumbnail: { imageId: "empty", variants: [] },
          thumbnailUrl: "/resolved.jpg",
        },
      ]}
      onArtisanClick={vi.fn()}
    />,
  );
  expect(screen.getByRole("presentation")).toHaveAttribute(
    "src",
    expect.stringContaining("/resolved.jpg"),
  );
});
