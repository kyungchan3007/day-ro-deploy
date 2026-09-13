import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RouteSummary } from "../../route/RouteSummary";

const meta = {
  component: RouteSummary,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    value: 37,
  },
} satisfies Meta<typeof RouteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: {
    label: "예상 도착시간",
    value: 52,
    unit: "분",
  },
};
