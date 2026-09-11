import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Gnb } from "./gnb";

const meta = {
  title: "Common/Gnb",
  component: Gnb,
  parameters: { layout: "fullscreen" },
  argTypes: {
    authStatus: {
      control: "inline-radio",
      options: ["loading", "anonymous", "authenticated"],
    },
  },
} satisfies Meta<typeof Gnb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { authStatus: "loading" },
};

export const Authenticated: Story = {
  args: { authStatus: "authenticated" },
};
