import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { ArtisanOrderGroup } from "./ArtisanOrderGroup";
it("does not expose a dead action when no destination is provided", () => {
  render(<ArtisanOrderGroup artisanName="장인 이름">작품</ArtisanOrderGroup>);
  expect(screen.getByText("장인 이름")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("uses the provided artisan action", async () => {
  const click = vi.fn();
  render(
    <ArtisanOrderGroup artisanName="장인 이름" onArtisanClick={click}>
      작품
    </ArtisanOrderGroup>,
  );
  await userEvent.click(screen.getByRole("button", { name: "장인 이름" }));
  expect(click).toHaveBeenCalledOnce();
});
