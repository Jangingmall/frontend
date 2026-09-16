import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
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

function ConfirmationStory() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="s" onClick={() => setOpen(true)}>
        안내 열기
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        variant="confirmation"
        title="로그인 후 이용 가능한 서비스입니다"
        description="로그인 페이지로 이동하시겠습니까?"
      >
        <div className="flex gap-2.5">
          <Button
            variant="jade"
            size="xl"
            className="flex-1 border-border-neutral-subtle"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="xl" className="flex-1" onClick={() => setOpen(false)}>
            로그인하기
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function FormStory() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button size="s" onClick={() => setOpen(true)}>
        목록 열기
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        variant="form"
        title="문의 전체보기"
        headerAction={<Checkbox>비밀글 제외</Checkbox>}
        footer={
          <div className="flex gap-2.5">
            <Button
              variant="jade"
              size="xl"
              className="w-40 border-border-neutral-subtle"
              onClick={() => setOpen(false)}
            >
              닫기
            </Button>
            <Button size="xl" className="flex-1">
              문의하기
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="border-b border-border-jade-weak py-4">
              <p className="text-body-s-b">문의 제목 {index + 1}</p>
              <p className="mt-2 text-body-s text-font-dark-subtle">
                내용이 길어져도 제목과 하단 버튼은 고정되어 있습니다.
              </p>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
}

export const Confirmation: Story = { render: () => <ConfirmationStory /> };
export const Form: Story = { render: () => <FormStory /> };
