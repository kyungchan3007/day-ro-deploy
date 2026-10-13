import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlaceNumberBadge } from "../../badge/PlaceNumberBadge";

const meta = {
  component: PlaceNumberBadge,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    value: 1,
  },
} satisfies Meta<typeof PlaceNumberBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const AccentSmall: Story = {
  args: {
    value: 2,
    variant: "accent",
    size: "sm",
  },
};

export const Arrive: Story = {
  args: {
    value: 5,
    variant: "arrive",
  },
};
