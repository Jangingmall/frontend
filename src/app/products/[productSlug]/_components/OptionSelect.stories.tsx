import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { OptionSelect } from "./OptionSelect";

const COLORS = [
  { value: "white", label: "백색" },
  { value: "cream", label: "미색 (+2,000원)" },
  { value: "sold", label: "청색 (품절)", disabled: true },
];
const SIZES = [
  { value: "s", label: "소 (15 cm)" },
  { value: "m", label: "중 (20 cm) (+10,000원)" },
];

/** 색상을 열면 아래 크기 옵션이 밀려 내려가는 구매 패널의 옵션 스택. */
function OptionStack({ defaultOpen }: { defaultOpen?: "color" | "size" }) {
  const [open, setOpen] = useState<"color" | "size" | null>(
    defaultOpen ?? null,
  );
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  return (
    <div className="flex w-97 flex-col gap-1">
      <OptionSelect
        ariaLabel="색상 (필수)"
        placeholder="1. 색상 (필수)"
        items={COLORS}
        value={color}
        open={open === "color"}
        onOpenChange={(next) => setOpen(next ? "color" : null)}
        onValueChange={(value) => {
          setColor(value);
          setOpen("size");
        }}
      />
      <OptionSelect
        ariaLabel="크기 (필수)"
        placeholder="2. 크기 (필수)"
        items={SIZES}
        value={size}
        open={open === "size"}
        onOpenChange={(next) => setOpen(next ? "size" : null)}
        onValueChange={(value) => {
          setSize(value);
          setOpen(null);
        }}
        disabled={!color}
      />
    </div>
  );
}

const meta = {
  title: "Product/OptionSelect",
  component: OptionStack,
  parameters: { layout: "padded" },
} satisfies Meta<typeof OptionStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const ColorOpen: Story = { args: { defaultOpen: "color" } };
export const SizeOpen: Story = { args: { defaultOpen: "size" } };
