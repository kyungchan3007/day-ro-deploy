import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { CourseOrderStrip } from "../../course/CourseOrderStrip";

const meta = {
  component: CourseOrderStrip,
  tags: ["ai-generated"],
  args: {
    max: 5,
    items: [
      { id: "a", name: "경복궁" },
      { id: "b", name: "광장시장" },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CourseOrderStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 일부만 채워진 상태(빈 슬롯은 "+ 추가"). */
export const Partial: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("list", { name: "선택한 방문 순서" }),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
};

export const Full: Story = {
  args: {
    items: [
      { id: "a", name: "경복궁" },
      { id: "b", name: "광장시장" },
      { id: "c", name: "북촌한옥마을" },
      { id: "d", name: "창덕궁" },
      { id: "e", name: "인사동" },
    ],
  },
};
