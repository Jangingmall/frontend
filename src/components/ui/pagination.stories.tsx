import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Pagination } from "./pagination";

// page/pageCount/onPageChange 필수라 개별 컴포넌트로 타입을 묶지 않는다.
const meta = {
  title: "UI/Pagination",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface InteractiveProps {
  pageCount: number;
}

function Interactive({ pageCount }: InteractiveProps) {
  const [page, setPage] = useState(1);
  return (
    <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
  );
}

export const Playground: Story = {
  render: () => <Interactive pageCount={20} />,
};

export const Cases: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Pagination page={1} pageCount={5} onPageChange={() => {}} />
      <Pagination page={1} pageCount={20} onPageChange={() => {}} />
      <Pagination page={10} pageCount={20} onPageChange={() => {}} />
      <Pagination page={20} pageCount={20} onPageChange={() => {}} />
    </div>
  ),
};
