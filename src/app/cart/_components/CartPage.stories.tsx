import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { cartFixtures } from "@/app/cart/_lib/cart-fixtures";

import { CartPage } from "./CartPage";
const meta = {
  title: "Pages/Cart",
  component: CartPage,
  args: { initialLines: cartFixtures.base },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CartPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MixedSoldOut: Story = {
  args: { initialLines: cartFixtures.mixed },
};
export const SoldOut: Story = { args: { initialLines: cartFixtures.soldOut } };
export const Empty: Story = { args: { initialLines: cartFixtures.empty } };
export const Login: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "2건 구매하기" }),
    );
  },
};
export const Delete: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "선택 삭제" }),
    );
  },
};
export const UndoToast: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "선택 삭제" }),
    );
    await userEvent.click(
      within(document.body).getByRole("button", { name: "삭제하기" }),
    );
  },
};
