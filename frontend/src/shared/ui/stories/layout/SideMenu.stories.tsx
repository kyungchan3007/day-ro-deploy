import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { useState } from "react";

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

/** 제어형: 상위 상태로 열고 닫는다(메뉴 항목 동작에 맞춰 외부에서 닫을 때 사용). */
export const Controlled: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white"
        >
          외부에서 열기
        </button>
        <SideMenu {...args} open={open} onOpenChange={setOpen} />
      </div>
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "외부에서 열기" }));
    await expect(
      canvas.getByRole("button", { name: "메뉴" }),
    ).toHaveAttribute("aria-expanded", "true");
  },
};
