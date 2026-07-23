import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { HeartIcon } from "../../icon";
import { MenuItem } from "../../menu/MenuItem";

const meta = {
  component: MenuItem,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    icon: <HeartIcon size={18} className="text-primary" />,
    label: "찜한 코스",
  },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsButton: Story = {
  args: {
    onClick: fn(),
  },
};

export const AsLink: Story = {
  args: {
    href: "/saved",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "찜한 코스" })).toHaveAttribute(
      "href",
      "/saved",
    );
  },
};
