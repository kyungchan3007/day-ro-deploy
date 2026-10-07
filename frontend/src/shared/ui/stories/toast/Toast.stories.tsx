import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toast } from "../../toast/Toast";

const meta = {
  component: Toast,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    message: "코스가 저장되었어요",
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Info: Story = {
  args: {
    variant: "info",
    message: "새로운 추천 코스를 불러왔어요",
  },
};
