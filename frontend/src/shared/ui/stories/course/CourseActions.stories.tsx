import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { CourseActions } from "../../course/CourseActions";

const meta = {
  component: CourseActions,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    onSave: fn(),
    onReroll: fn(),
  },
} satisfies Meta<typeof CourseActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabels: Story = {
  args: {
    saveLabel: "코스 보관하기",
    rerollLabel: "다른 코스 보기",
  },
};
