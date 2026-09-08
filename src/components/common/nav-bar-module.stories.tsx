import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { NavBarModule } from "./nav-bar-module";

const meta = {
  title: "Common/NavBarModule",
  component: NavBarModule,
  parameters: { layout: "fullscreen" },
  args: { onSearch: fn() },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "category", "search"],
    },
  },
} satisfies Meta<typeof NavBarModule>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { variant: "default", cartCount: 3 } };
export const Category: Story = { args: { variant: "category", cartCount: 3 } };
export const Search: Story = { args: { variant: "search", cartCount: 3 } };
