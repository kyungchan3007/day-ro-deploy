import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { OnboardingCarousel } from "./OnboardingCarousel";

/** 온보딩 3장 (issue #230 · QA #25). 다음 · 이전 · 화살표 키 · 마지막 장 "시작하기". */
const meta = {
  component: OnboardingCarousel,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [(Story) => <div style={{ height: 760 }}><Story /></div>],
} satisfies Meta<typeof OnboardingCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstSlide: Story = {};

/** 다음으로 마지막 장까지 가면 버튼이 "시작하기"로 바뀐다. 첫 장 · 마지막 장에서 화살표 키는 멈춘다. */
export const WalkThrough: Story = {
  play: async ({ canvas }) => {
    const visibleTitle = () => canvas.getByRole("heading", { level: 1 });
    await expect(visibleTitle()).toHaveTextContent(/서울/);
    await userEvent.click(canvas.getByRole("button", { name: "다음" }));
    await expect(visibleTitle()).toHaveTextContent(/AI가/);
    await userEvent.click(canvas.getByRole("button", { name: "다음" }));
    await expect(visibleTitle()).toHaveTextContent(/저장하고/);
    await expect(canvas.getByRole("button", { name: "시작하기" })).toBeInTheDocument();

    canvas.getByRole("group", { name: /3장 중/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(visibleTitle()).toHaveTextContent(/저장하고/);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(visibleTitle()).toHaveTextContent(/AI가/);
  },
};
