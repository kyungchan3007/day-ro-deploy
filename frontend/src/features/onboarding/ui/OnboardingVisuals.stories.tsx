import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AiRecommendVisual, RegionVisual, RouteShareVisual } from "./OnboardingVisuals";

/** 온보딩 장별 그림 (issue #230). 꾸밈용(aria-hidden). */
const meta = {
  component: RegionVisual,
  tags: ["ai-generated"],
  parameters: { layout: "padded" },
  decorators: [(Story) => <div style={{ width: 335 }}><Story /></div>],
} satisfies Meta<typeof RegionVisual>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Region: Story = {};

export const AiRecommend: Story = { render: () => <AiRecommendVisual /> };

export const RouteShare: Story = { render: () => <RouteShareVisual /> };
