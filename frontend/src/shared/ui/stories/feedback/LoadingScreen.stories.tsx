import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Illustration } from "../../illustration";
import { LoadingScreen } from "../../feedback/LoadingScreen";

const meta = {
  component: LoadingScreen,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    illustration: <Illustration name="map-pin" width={140} />,
    message: "취향에 맞는 코스를 찾고 있어요",
    subMessage: "잠시만 기다려주세요",
  },
} satisfies Meta<typeof LoadingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMiddleContent: Story = {
  args: {
    middle: (
      <span className="rounded-pill bg-primary-surface px-4 py-2 text-sm font-semibold text-primary">
        위치와 목적을 분석 중
      </span>
    ),
  },
};

export const LongCopy: Story = {
  args: {
    message: "저장된 취향과 현재 선택값을 바탕으로 추천 코스를 조합하고 있어요",
    subMessage: "장소, 이동수단, 전체 흐름을 순서대로 계산하는 중입니다",
  },
};
