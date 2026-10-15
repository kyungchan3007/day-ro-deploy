import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../../button";
import { AppShell } from "../../layout/AppShell";
import { NavBar } from "../../layout/NavBar";

const meta = {
  component: AppShell,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AppShell
      nav={<NavBar showBack={false} />}
      footer={
        <div className="border-t border-border bg-surface px-4 py-3 sm:px-6">
          <Button fullWidth size="lg">
            다음
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <h1 className="text-lg font-bold text-text-strong">앱 셸 미리보기</h1>
        <p className="text-sm text-text-muted">
          네비게이션, 본문, 하단 액션이 고정된 기본 화면 구조입니다.
        </p>
      </div>
    </AppShell>
  ),
};

export const BleedContent: Story = {
  render: () => (
    <AppShell nav={<NavBar />} bleed>
      <div className="h-40 bg-primary-surface" />
    </AppShell>
  ),
};
