import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StepProgress } from "../../progress/StepProgress";

const meta = {
  component: StepProgress,
  tags: ["ai-generated"],
  parameters: {
    layout: "padded",
  },
  args: {
    current: 1,
    total: 3,
  },
} satisfies Meta<typeof StepProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {};

export const Middle: Story = {
  args: {
    current: 2,
    total: 3,
  },
};

export const Complete: Story = {
  args: {
    current: 3,
    total: 3,
  },
};
