import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { PlaceCard } from "../../card/PlaceCard";

const meta = {
  component: PlaceCard,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    order: 1,
    name: "프릳츠 연남점",
    category: "카페",
    region: "연남동/홍대입구",
  },
} satisfies Meta<typeof PlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = {
  args: {
    defaultOpen: true,
    imageSrc: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    hours: "10:00 ~ 22:00",
    address: "서울 마포구 연남동 000-00",
    rating: "4.7/5",
  },
};

export const WithMoveInfo: Story = {
  args: {
    moveInfo: {
      mode: "walk",
      minutes: 8,
    },
  },
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "펼치기" });
    await userEvent.click(toggle);
    await expect(
      canvas.getByRole("button", { name: "접기" }),
    ).toBeVisible();
  },
};
