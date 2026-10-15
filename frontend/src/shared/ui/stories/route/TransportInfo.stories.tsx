import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TransportInfo } from "../../route/TransportInfo";

const meta = {
  component: TransportInfo,
  tags: ["ai-generated"],
  parameters: { layout: "centered" },
  args: { mode: "walk", minutes: 8 },
} satisfies Meta<typeof TransportInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Walk: Story = {};

export const Subway: Story = { args: { mode: "subway", minutes: 15 } };

export const Bus: Story = { args: { mode: "bus", minutes: 12 } };

export const UnknownMinutes: Story = { args: { mode: "car", minutes: undefined } };
