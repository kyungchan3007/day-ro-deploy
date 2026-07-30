import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { SelectablePlaceCard } from "../../card/SelectablePlaceCard";

const meta = {
  component: SelectablePlaceCard,
  tags: ["ai-generated"],
  args: {
    name: "경복궁",
    category: "고궁",
    region: "종로구",
    onToggle: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectablePlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true, order: 2 },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /경복궁/ });
    await expect(button).toHaveAttribute("aria-pressed", "true");
  },
};

/** 최대 선택 도달 시 미선택 카드의 비활성 상태. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /경복궁/ })).toBeDisabled();
  },
};

export const LongName: Story = {
  args: { name: "아주 긴 장소 이름이 들어가는 경우의 말줄임 확인용 카드", region: "종로구" },
};
