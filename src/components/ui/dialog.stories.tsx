import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "./button";
import { Dialog } from "./dialog";
import { Select, SelectItem } from "./select";

const meta = {
  title: "UI/Dialog",
  parameters: { layout: "centered" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function DialogStory() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="s" onClick={() => setOpen(true)}>
        모달 열기
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="상품 문의"
        description="작품에 대해 궁금한 내용을 남겨주세요."
      >
        <Select
          ariaLabel="문의 유형"
          items={[
            { value: "product", label: "상품 문의" },
            { value: "shipping", label: "배송 문의" },
          ]}
        >
          <SelectItem value="product">상품 문의</SelectItem>
          <SelectItem value="shipping">배송 문의</SelectItem>
        </Select>
        <p className="my-6 text-body-m text-font-dark-subtle">
          Tab 키로 이동하고 Escape 키 또는 배경을 눌러 닫을 수 있습니다.
        </p>
        <Button size="s" onClick={() => setOpen(false)}>
          확인
        </Button>
      </Dialog>
    </>
  );
}

export const Default: Story = { render: () => <DialogStory /> };
