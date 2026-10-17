import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Toast } from "../../toast/Toast";
import { ToastViewport } from "../../toast/ToastViewport";

/**
 * 전 화면 공통 토스트 위치(issue #194): 헤더 바로 아래 상단, 640 컬럼 가운데.
 * 하단 CTA · 모바일 키보드 · 하단 시트와 겹치지 않는다.
 */
const meta = {
  component: ToastViewport,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => (
      <div className="relative h-[480px] w-full bg-surface">
        <div className="h-12 border-b border-border" aria-hidden />
        <Story />
        <div className="absolute inset-x-4 bottom-4 h-13 rounded-pill bg-primary" aria-hidden />
      </div>
    ),
  ],
} satisfies Meta<typeof ToastViewport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    children: <Toast message="코스가 저장되었습니다." />,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("코스가 저장되었습니다.");
  },
};

/** 상황 입력 첫 화면: 단계 안내와 일반 토스트가 함께 뜨는 경우 위에서부터 쌓인다. */
export const Stacked: Story = {
  args: {
    children: [
      <Toast key="guide" variant="info" message="시간 → 장소 → 목적 순으로 추천해드려요" />,
      <Toast key="toast" message="길안내 링크를 복사했어요." />,
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("status")).toHaveLength(2);
  },
};
