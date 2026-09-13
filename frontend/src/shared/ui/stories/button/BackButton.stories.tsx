import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { BackButton } from "../../button/BackButton";

const meta = {
  component: BackButton,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    ariaLabel: "뒤로가기",
  },
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActionButton: Story = {
  args: {
    onClick: fn(),
  },
};

export const AsLink: Story = {
  args: {
    ariaLabel: "코스 생성으로 돌아가기",
    href: "/course/new",
  },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "코스 생성으로 돌아가기" });
    await expect(link).toHaveAttribute("href", "/course/new");
  },
};
