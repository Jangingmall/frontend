import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Breadcrumb, BreadcrumbItem } from "./breadcrumb";

// children(항목들)이 필수라 개별 컴포넌트로 타입을 묶지 않는다.
const meta = {
  title: "UI/Breadcrumb",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem index="01" href="#">
        장바구니
      </BreadcrumbItem>
      <BreadcrumbItem index="02" href="#">
        주문/결제
      </BreadcrumbItem>
      <BreadcrumbItem index="03" current>
        주문 완료
      </BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const TwoSteps: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem index="01" href="#">
        장바구니
      </BreadcrumbItem>
      <BreadcrumbItem index="02" current>
        장바구니
      </BreadcrumbItem>
    </Breadcrumb>
  ),
};
