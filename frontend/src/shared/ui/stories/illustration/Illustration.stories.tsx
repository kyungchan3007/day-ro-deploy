import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Illustration } from "../../illustration/Illustration";

const meta = {
  component: Illustration,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    name: "date-planning",
    width: 180,
  },
} satisfies Meta<typeof Illustration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DatePlanning: Story = {};

export const Intro: Story = {
  args: {
    name: "intro",
    width: 220,
  },
};

export const ChatHeart: Story = {
  args: {
    name: "chat-heart",
    width: 120,
  },
};
