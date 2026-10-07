import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { SaveCourseSheet } from "./SaveCourseSheet";

const meta = {
  component: SaveCourseSheet,
  tags: ["ai-generated"],
  args: {
    open: true,
    onClose: fn(),
    // 저장이 끝나지 않는 상태(saving 유지)를 재현한다.
    onSubmit: fn(() => new Promise<void>(() => {})),
  },
} satisfies Meta<typeof SaveCourseSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 열리면 코스명 입력에 포커스가 들어간다. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const portalCanvas = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(portalCanvas.getByLabelText(/코스명/)).toHaveFocus());
  },
};

/**
 * 저장 중: 포커스가 코스명 입력으로 튀지 않고, Esc 로 닫히지 않는다(issue #133 회귀 방지).
 * 이전 구현은 saving 이 바뀔 때마다 dialog effect 가 다시 실행돼 코스명 입력으로 포커스를 옮겼다.
 */
export const SavingKeepsFocus: Story = {
  play: async ({ canvasElement, args }) => {
    const portalCanvas = within(canvasElement.ownerDocument.body);
    const name = portalCanvas.getByLabelText(/코스명/);
    const description = portalCanvas.getByLabelText("한 줄 설명");
    await waitFor(() => expect(name).toHaveFocus());

    await userEvent.type(name, "종로 데이트");
    await userEvent.click(description);
    await userEvent.keyboard("{Enter}");

    await expect(await portalCanvas.findByRole("button", { name: "저장 중..." })).toBeDisabled();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await expect(description).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};
