import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";

import { AlertCircleIcon } from "../../icon";
import { ConfirmDialog } from "../../dialog/ConfirmDialog";

const meta = {
  component: ConfirmDialog,
  tags: ["ai-generated"],
  args: {
    open: true,
    title: "정말 삭제할까요?",
    body: "삭제 후에는 되돌릴 수 없습니다.",
    confirmLabel: "삭제하기",
    onConfirm: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleAction: Story = {
  args: {
    icon: <AlertCircleIcon size={24} className="text-danger" />,
  },
};

export const WithCancel: Story = {
  args: {
    icon: <AlertCircleIcon size={24} className="text-danger" />,
    cancelLabel: "취소",
    confirmTone: "danger",
  },
  play: async ({ canvasElement }) => {
    const portalCanvas = within(canvasElement.ownerDocument.body);
    await expect(
      await portalCanvas.findByRole("dialog", { name: "정말 삭제할까요?" }),
    ).toBeVisible();
  },
};

/** 처리 중: 버튼이 잠기고 backdrop·Esc 닫기가 막힌다. */
export const Pending: Story = {
  args: {
    icon: <AlertCircleIcon size={24} className="text-danger" />,
    cancelLabel: "취소",
    confirmLabel: "삭제 중…",
    confirmTone: "danger",
    pending: true,
  },
  play: async ({ canvasElement }) => {
    const portalCanvas = within(canvasElement.ownerDocument.body);
    const dialog = await portalCanvas.findByRole("dialog", {
      name: "정말 삭제할까요?",
    });
    await expect(dialog).toHaveAttribute("aria-busy", "true");
    await expect(
      portalCanvas.getByRole("button", { name: "삭제 중…" }),
    ).toBeDisabled();
  },
};
