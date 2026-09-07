import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Select, SelectItem } from "./select";

// children(옵션들)이 필수라 개별 컴포넌트로 타입을 묶지 않는다.
const meta = {
  title: "UI/Select",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const options = ["최신순", "인기순", "낮은 가격순", "높은 가격순"];

/** module 2 — 텍스트만 (정렬 드롭다운) */
export const Plain: Story = {
  render: () => (
    <div className="w-40">
      <Select placeholder="정렬" defaultValue="최신순">
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </Select>
    </div>
  ),
};

/** module 1 — 라디오형 인디케이터 */
export const WithIndicator: Story = {
  render: () => (
    <div className="w-72">
      <Select placeholder="항목을 선택해주세요">
        {options.map((o) => (
          <SelectItem key={o} value={o} indicator>
            {o}
          </SelectItem>
        ))}
      </Select>
    </div>
  ),
};

export const Open: Story = {
  render: () => (
    <div className="h-64 w-72">
      <Select
        placeholder="항목을 선택해주세요"
        defaultOpen
        defaultValue="인기순"
      >
        {options.map((o) => (
          <SelectItem key={o} value={o} indicator>
            {o}
          </SelectItem>
        ))}
      </Select>
    </div>
  ),
};
