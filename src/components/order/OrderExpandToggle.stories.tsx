import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { OrderExpandToggle } from "./OrderExpandToggle";

const meta = {
  title: "Order/OrderExpandToggle",
  component: OrderExpandToggle,
  decorators: [
    (Story) => (
      <div className="w-140">
        <Story />
      </div>
    ),
  ],
  args: {
    itemCount: 3,
  },
} satisfies Meta<typeof OrderExpandToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: { isExpanded: false, onToggle: () => {} },
};

export const Expanded: Story = {
  args: { isExpanded: true, onToggle: () => {} },
};

export const Interactive: Story = {
  args: { isExpanded: false, onToggle: () => {} },
  render: (args) => {
    function Demo() {
      const [isExpanded, setIsExpanded] = useState(false);
      return (
        <OrderExpandToggle
          {...args}
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded((value) => !value)}
        />
      );
    }
    return <Demo />;
  },
};
