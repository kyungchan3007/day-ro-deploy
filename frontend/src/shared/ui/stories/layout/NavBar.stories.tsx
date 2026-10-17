import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MenuIcon } from "../../icon";
import { NavBar } from "../../layout/NavBar";
import { NavTitle } from "../../layout/NavTitle";

const meta = {
  component: NavBar,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutBack: Story = {
  args: {
    showBack: false,
  },
};

export const WithRightAction: Story = {
  args: {
    right: (
      <button
        type="button"
        aria-label="메뉴 열기"
        className="flex size-9 items-center justify-center rounded-full text-text-strong"
      >
        <MenuIcon size={22} />
      </button>
    ),
  },
};

/** 화면 제목은 공용 `NavTitle` 을 center 슬롯에 넣는다(issue #227). */
export const WithTitle: Story = {
  args: {
    center: <NavTitle>자주 묻는 질문</NavTitle>,
  },
};
