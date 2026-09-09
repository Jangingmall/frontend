import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { ArrowRightIcon } from "./icons";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: {
    children: "CTA",
    variant: "solid",
    size: "l",
    loading: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["solid", "jade", "outline", "ghost"],
    },
    size: {
      control: "inline-radio",
      options: ["xl", "l", "m", "s", "xs"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const variants = ["solid", "jade", "outline", "ghost"] as const;
const sizes = ["xl", "l", "m", "s", "xs"] as const;

/** variant × size 전체 조합. Figma 의 name(xl-black/xl-jade/l-black/.../option/footer) 을
 * 직교 구조로 편 결과를 한눈에 확인한다. */
export const Matrix: Story = {
  render: () => (
    <table className="border-separate border-spacing-4">
      <thead>
        <tr>
          <th />
          {sizes.map((size) => (
            <th key={size} className="text-body-s text-font-dark-subtle">
              {size}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {variants.map((variant) => (
          <tr key={variant}>
            <th className="text-body-s text-font-dark-subtle">{variant}</th>
            {sizes.map((size) => (
              <td key={size}>
                <Button variant={variant} size={size}>
                  CTA
                </Button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/** default / disabled / loading. hover·pressed 는 실제 포인터 상호작용으로 확인. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-body-s text-font-dark-subtle">
            {variant}
          </span>
          <Button variant={variant}>Default</Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Loading
          </Button>
        </div>
      ))}
    </div>
  ),
};

/**
 * 아이콘은 children 으로 배치한다(`[&_svg]` 로 크기·정렬만 관리). Figma `m` 은 leading,
 * `icon` 은 trailing.
 *
 * 주의: `components/ui/icons` 자산은 색이 하드코딩돼 있어 `currentColor` 를 안 따른다
 * (foundation 아이콘 작업 기록 참고). 그래서 어두운 배경의 `solid` 위에서는 아이콘이 안
 * 보인다 — solid + 아이콘이 필요해지면 해당 아이콘을 currentColor 로 바꾸는 별도 작업이
 * 필요하다. 여기서는 밝은 배경 variant 로만 보여준다.
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button variant="jade">
        CTA
        <ArrowRightIcon />
      </Button>
      <Button variant="outline" size="m">
        <ArrowRightIcon />
        CTA
      </Button>
      <Button variant="ghost" size="xs">
        더보기
        <ArrowRightIcon />
      </Button>
    </div>
  ),
};
