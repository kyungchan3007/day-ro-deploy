import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LogoSymbol } from "../../logo/LogoSymbol";

const meta = {
  component: LogoSymbol,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    height: 28,
  },
} satisfies Meta<typeof LogoSymbol>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    height: 44,
  },
};
