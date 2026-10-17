import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "../../button/Button";
import { EmptyState } from "../../feedback/EmptyState";

const meta = {
  component: EmptyState,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: {
    title: "아직 찜한 코스가 없어요",
    description: "마음에 드는 코스를 저장하면 여기에서 다시 볼 수 있어요.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 행동 버튼과 함께 (찜 목록 빈 상태). */
export const WithAction: Story = {
  args: {
    action: (
      <Button size="lg" fullWidth className="mt-2 max-w-xs">
        코스 만들러 가기
      </Button>
    ),
  },
};

/** 화면 대표 제목일 때 h1 로 (공유 링크 이동 화면). */
export const AsPageHeading: Story = {
  args: {
    titleAs: "h1",
    illustration: "map-pin",
    title: "길안내로 이동하고 있어요",
    description: "자동으로 열리지 않으면 아래 버튼을 눌러주세요.",
  },
};
