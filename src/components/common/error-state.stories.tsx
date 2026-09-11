import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ErrorState } from "./error-state";

const meta = {
  title: "Common/ErrorState",
  component: ErrorState,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { code: "INTERNAL_ERROR" },
};

export const WithRetry: Story = {
  args: { code: "INTERNAL_ERROR", onRetry: fn() },
};

export const NotFound: Story = {
  args: { code: "NOT_FOUND" },
};

export const Unauthorized: Story = {
  args: { code: "UNAUTHORIZED", onRetry: fn(), retryLabel: "다시 로그인" },
};

export const CustomDescription: Story = {
  args: {
    title: "상품을 불러올 수 없어요",
    description: "삭제됐거나 잘못된 링크예요.",
  },
};
