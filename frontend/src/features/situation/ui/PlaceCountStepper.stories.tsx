import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { usePlaceCountStep } from "../hooks/usePlaceCountStep";
import { PlaceCountStepper } from "./PlaceCountStepper";

/** 상황입력 시간 스텝 장소 수 스테퍼 (QA #9 · issue #247). 2~5곳 · 기본 3곳. */
function Interactive({ initial }: { initial?: number }) {
  const places = usePlaceCountStep(initial);
  return (
    <PlaceCountStepper
      count={places.count}
      canDecrease={places.canDecrease}
      canIncrease={places.canIncrease}
      onDecrease={places.decrease}
      onIncrease={places.increase}
    />
  );
}

const meta = {
  component: Interactive,
  tags: ["ai-generated"],
  decorators: [(Story) => <div style={{ width: 360 }}><Story /></div>],
} satisfies Meta<typeof Interactive>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AtMinimum: Story = { args: { initial: 2 } };

export const AtMaximum: Story = { args: { initial: 5 } };

export const StepsWithinRange: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plus = canvas.getByRole("button", { name: "늘리기" });
    const minus = canvas.getByRole("button", { name: "줄이기" });
    await userEvent.click(plus);
    await userEvent.click(plus);
    await expect(canvas.getByRole("status")).toHaveTextContent("장소 5곳");
    await expect(plus).toBeDisabled();
    await userEvent.click(minus);
    await userEvent.click(minus);
    await userEvent.click(minus);
    await expect(canvas.getByRole("status")).toHaveTextContent("장소 2곳");
    await expect(minus).toBeDisabled();
  },
};
