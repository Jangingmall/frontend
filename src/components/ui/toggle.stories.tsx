import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
  args: { size: "m" },
  argTypes: { size: { control: "inline-radio", options: ["s", "m"] } },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Matrix: Story = {
  render: () => (
    <table className="border-separate border-spacing-x-8 border-spacing-y-4">
      <thead>
        <tr className="text-body-s text-font-dark-subtle">
          <th />
          <th>off</th>
          <th>on</th>
          <th>disabled</th>
        </tr>
      </thead>
      <tbody>
        {(["s", "m"] as const).map((size) => (
          <tr key={size}>
            <th className="text-body-s text-font-dark-subtle">{size}</th>
            <td>
              <Toggle size={size} />
            </td>
            <td>
              <Toggle size={size} defaultChecked />
            </td>
            <td>
              <Toggle size={size} defaultChecked disabled />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
