import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Illustration } from "../../illustration";
import { Floating } from "../../motion/Floating";

/** 위아래로 둥둥 떠 있는 래퍼. 동작 줄이기 설정이면 멈춘다. */
const meta = {
  component: Floating,
  tags: ["ai-generated"],
  parameters: { layout: "centered" },
  args: {
    children: <Illustration name="date-planning" width={140} />,
  },
} satisfies Meta<typeof Floating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
