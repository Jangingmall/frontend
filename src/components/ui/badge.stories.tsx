import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  args: { children: "보유자", variant: "jade" },
  argTypes: {
    variant: { control: "inline-radio", options: ["jade", "solid", "plain"] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {["보유자", "전승교육사", "국가유산", "분야"].map((t) => (
          <Badge key={t} variant="jade">
            {t}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {["한정판매", "신상품", "인기상품"].map((t) => (
          <Badge key={t} variant="solid">
            {t}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {["입금확인", "배송중", "배송완료", "구매확정"].map((t) => (
          <Badge key={t} variant="plain">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  ),
};
