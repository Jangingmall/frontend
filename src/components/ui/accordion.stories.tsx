import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Accordion, AccordionItem } from "./accordion";

// children(항목들)이 필수라 개별 컴포넌트로 타입을 묶지 않는다.
const meta = {
  title: "UI/Accordion",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="w-80">
      <Accordion title="Filter" onReset={() => {}} defaultValue={["category"]}>
        <AccordionItem value="category" title="카테고리">
          <p>패션 · 리빙 · 푸드 · 뷰티</p>
        </AccordionItem>
        <AccordionItem value="price" title="가격">
          <p>0원 ~ 100만 원+</p>
        </AccordionItem>
        <AccordionItem value="brand" title="브랜드">
          <p>전체 브랜드 목록</p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const WithoutHeader: Story = {
  render: () => (
    <div className="w-80">
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a" title="펼침 항목">
          <p>펼쳐진 내용</p>
        </AccordionItem>
        <AccordionItem value="b" title="접힘 항목">
          <p>숨겨진 내용</p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
