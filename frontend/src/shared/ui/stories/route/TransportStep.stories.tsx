import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransportStep, TransportStepList } from "../../route/TransportStep";

const meta = {
  component: TransportStep,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    mode: "walk",
    index: 2,
  },
} satisfies Meta<typeof TransportStep>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const OutlinedStart: Story = {
  args: {
    mode: "start",
    index: 1,
    outlined: true,
  },
};

export const Sequence: Story = {
  render: () => (
    <TransportStepList steps={["start", "walk", "subway", "arrive"]} />
  ),
};
