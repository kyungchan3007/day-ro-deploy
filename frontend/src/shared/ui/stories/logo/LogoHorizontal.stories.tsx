import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LogoHorizontal } from "../../logo/LogoHorizontal";

const meta = {
  component: LogoHorizontal,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    height: 24,
  },
} satisfies Meta<typeof LogoHorizontal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    height: 36,
  },
};
