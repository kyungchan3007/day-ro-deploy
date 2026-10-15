import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PathRoute } from "../../route/PathRoute";

const meta = {
  component: PathRoute,
  tags: ["ai-generated"],
  parameters: { layout: "centered" },
  args: { length: 160 },
} satisfies Meta<typeof PathRoute>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};

export const Dashed: Story = { args: { variant: "dashed" } };

export const Dotted: Story = { args: { variant: "dotted", color: "var(--color-transport-walk)" } };

export const Vertical: Story = { args: { orientation: "vertical", length: 80 } };
