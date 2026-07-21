import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "../../logo/Logo";

const meta = {
  component: Logo,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    height: 28,
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SymbolOnly: Story = {
  args: {
    withWordmark: false,
  },
};

export const Large: Story = {
  args: {
    height: 40,
  },
};
