import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { siteStatic } from "@/shared/static/site";
import { SiteFooter } from "../../layout/SiteFooter";

/** 홈 · 시작 화면 공용 푸터 (issue #230). */
const meta = {
  component: SiteFooter,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: { ...siteStatic.footer },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
