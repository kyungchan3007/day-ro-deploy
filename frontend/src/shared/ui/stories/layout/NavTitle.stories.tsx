import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NavTitle } from "../../layout/NavTitle";

/** 내비 바 가운데 화면 제목 (issue #227). NavBar · AccountNavBar 의 center 슬롯에 넣는다. */
const meta = {
  component: NavTitle,
  tags: ["ai-generated"],
  parameters: { layout: "centered" },
  args: { children: "자주 묻는 질문" },
} satisfies Meta<typeof NavTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
