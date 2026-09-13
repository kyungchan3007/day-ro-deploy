import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransportLabel } from "../../route/TransportLabel";

const meta = {
  component: TransportLabel,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    mode: "walk",
    minutes: 5,
  },
} satisfies Meta<typeof TransportLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Walk: Story = {};

export const Subway: Story = {
  args: {
    mode: "subway",
    minutes: 12,
  },
};

export const Car: Story = {
  args: {
    mode: "car",
    minutes: 18,
  },
};
