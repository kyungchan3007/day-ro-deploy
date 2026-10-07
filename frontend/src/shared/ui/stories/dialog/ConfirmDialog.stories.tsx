import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

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

/** 키보드: 열리면 확인 버튼 포커스 → Tab 순환 → Esc 닫기 → 여는 버튼으로 포커스 복원(issue #133). */
export const KeyboardFocusTrap: Story = {
  args: {
    open: false,
    cancelLabel: "취소",
    confirmTone: "danger",
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-4">
        <button type="button" onClick={() => setOpen(true)}>
          삭제 확인 열기
        </button>
        <ConfirmDialog
          {...args}
          open={open}
          onClose={() => {
            args.onClose();
            setOpen(false);
          }}
        />
      </div>
    );
  },
  play: async ({ canvasElement, canvas }) => {
    const portalCanvas = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "삭제 확인 열기" });
    await userEvent.click(opener);

    const confirm = await portalCanvas.findByRole("button", { name: "삭제하기" });
    const cancel = portalCanvas.getByRole("button", { name: "취소" });
    await waitFor(() => expect(confirm).toHaveFocus());

    // 마지막 요소(확인)에서 Tab → 첫 요소(취소), Shift+Tab → 다시 확인.
    await userEvent.tab();
    await expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(confirm).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** 처리 중에는 Esc 로 닫히지 않는다(issue #133). */
export const PendingIgnoresEscape: Story = {
  args: {
    cancelLabel: "취소",
    confirmLabel: "삭제 중…",
    confirmTone: "danger",
    pending: true,
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const portalCanvas = within(canvasElement.ownerDocument.body);
    const dialog = await portalCanvas.findByRole("dialog", { name: "정말 삭제할까요?" });

    await userEvent.keyboard("{Escape}");

    await expect(args.onClose).not.toHaveBeenCalled();
    await expect(dialog).toBeInTheDocument();
  },
};
