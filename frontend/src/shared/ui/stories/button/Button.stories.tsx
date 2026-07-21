import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { DownloadIcon, RefreshIcon } from "../../icon";
import { Button } from "../../button/Button";

const meta = {
  component: Button,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "버튼",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "추천받기!",
    variant: "primary",
    size: "lg",
  },
};

export const SecondaryWithIcon: Story = {
  args: {
    children: "코스저장",
    variant: "secondary",
    size: "sm",
    leftIcon: <DownloadIcon size={15} />,
  },
};

export const GhostWithRightIcon: Story = {
  args: {
    children: "다시 고르기",
    variant: "ghost",
    rightIcon: <RefreshIcon size={15} />,
  },
};

export const Disabled: Story = {
  args: {
    children: "비활성 버튼",
    disabled: true,
  },
};

export const CssCheck: Story = {
  args: {
    children: "Submit",
    variant: "primary",
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Submit" });
    await expect(getComputedStyle(button).backgroundColor).toBe(
      "rgb(120, 0, 233)",
    );
  },
};
