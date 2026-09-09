import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
  args: { size: "s" },
  argTypes: { size: { control: "inline-radio", options: ["s", "m"] } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: { children: "Label" } };

export const Matrix: Story = {
  render: () => (
    <table className="border-separate border-spacing-x-8 border-spacing-y-4">
      <thead>
        <tr className="text-body-s text-font-dark-subtle">
          <th />
          <th>unchecked</th>
          <th>checked</th>
          <th>with label</th>
          <th>disabled</th>
        </tr>
      </thead>
      <tbody>
        {(["s", "m"] as const).map((size) => (
          <tr key={size}>
            <th className="text-body-s text-font-dark-subtle">{size}</th>
            <td>
              <Checkbox size={size} />
            </td>
            <td>
              <Checkbox size={size} defaultChecked />
            </td>
            <td>
              <Checkbox size={size} defaultChecked>
                Label
              </Checkbox>
            </td>
            <td>
              <Checkbox size={size} defaultChecked disabled>
                Label
              </Checkbox>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
