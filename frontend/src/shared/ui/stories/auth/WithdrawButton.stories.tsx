import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { WithdrawButton } from "../../auth/WithdrawButton";

const meta = {
  component: WithdrawButton,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    label: "회원탈퇴",
  },
} satisfies Meta<typeof WithdrawButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsButton: Story = {
  args: {
    onClick: fn(),
  },
};

export const AsLink: Story = {
  args: {
    href: "/mypage/withdraw",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "회원탈퇴" })).toHaveAttribute(
      "href",
      "/mypage/withdraw",
    );
  },
};
