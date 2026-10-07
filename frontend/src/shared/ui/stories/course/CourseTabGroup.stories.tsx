import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { CourseTabGroup } from "../../course/CourseTabGroup";

const options = [
  { value: "a", label: "A course", sublabel: "최단 거리" },
  { value: "b", label: "B course", sublabel: "분위기 우선" },
  { value: "c", label: "C course", sublabel: "이동 적음", disabled: true },
] as const;

const meta = {
  component: CourseTabGroup,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    options: [...options],
  },
} satisfies Meta<typeof CourseTabGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Uncontrolled: Story = {};

export const Controlled: Story = {
  args: {
    value: "b",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tab", { name: /B course/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};
