import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LogoFull } from "../../logo/LogoFull";

const meta = {
  component: LogoFull,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    width: 160,
  },
} satisfies Meta<typeof LogoFull>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    width: 120,
  },
};
