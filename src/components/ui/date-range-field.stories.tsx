import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { DateRangeField } from "./date-range-field";

const meta = {
  title: "UI/DateRangeField",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled() {
  const [range, setRange] = useState({ from: "2026-09-07", to: "2026-09-07" });
  return (
    <div className="w-56">
      <DateRangeField
        from={range.from}
        to={range.to}
        onChange={setRange}
        ariaLabel="검색 기간"
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Controlled />,
};
