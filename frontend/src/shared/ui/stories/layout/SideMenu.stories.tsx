import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { LogoutButton } from "../../auth";
import { MenuItem } from "../../menu";
import { SideMenu } from "../../layout/SideMenu";

const meta = {
  component: SideMenu,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    triggerLabel: "메뉴",
    title: "사이드 메뉴",
    children: (
      <div className="flex flex-col gap-2">
        <MenuItem label="마이페이지" href="/mypage" />
        <MenuItem label="찜한 코스" href="/saved" />
        <LogoutButton />
      </div>
    ),
  },
} satisfies Meta<typeof SideMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Opened: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "메뉴" });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};
