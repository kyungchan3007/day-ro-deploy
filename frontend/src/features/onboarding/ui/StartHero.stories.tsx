import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StartHero } from "./StartHero";

/** 시작 화면(비회원 첫 진입) 위쪽 소개 (issue #230). */
const meta = {
  component: StartHero,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div style={{ height: 560, display: "flex", flexDirection: "column" }}><Story /></div>],
} satisfies Meta<typeof StartHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
