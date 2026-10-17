import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "../../button/Button";
import { MenuItem } from "../../menu/MenuItem";
import { BottomSheet } from "../../sheet/BottomSheet";

const meta = {
  component: BottomSheet,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onClose: fn(),
    title: "길안내 공유",
    children: (
      <ul>
        <li>
          <MenuItem label="링크 복사" onClick={() => {}} />
        </li>
        <li>
          <MenuItem label="다른 앱으로 공유" onClick={() => {}} />
        </li>
      </ul>
    ),
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 메뉴를 담은 시트 (길안내 공유 시트와 같은 모양). */
export const WithMenu: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("dialog", { name: "길안내 공유" })).toBeInTheDocument();
  },
};

/** ESC 로 닫기 요청을 보낸다. */
export const ClosesOnEscape: Story = {
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole("dialog", { name: "길안내 공유" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(args.onClose).toHaveBeenCalled());
  },
};

/**
 * 버튼으로 열고 닫는 예.
 * 포커스 대상을 안 줘도 시트 안 첫 항목으로 포커스가 옮겨지고, Tab 은 시트 안에서 돌며, 닫으면 열기 버튼으로 돌아온다(issue #227).
 */
export const Toggle: Story = {
  args: { open: false },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-6">
        <Button onClick={() => setOpen(true)}>시트 열기</Button>
        <BottomSheet {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
  play: async ({ canvas, canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "시트 열기" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");

    const copyLink = await body.findByRole("button", { name: "링크 복사" });
    await waitFor(() => expect(copyLink).toHaveFocus());

    await userEvent.tab();
    await expect(body.getByRole("button", { name: "다른 앱으로 공유" })).toHaveFocus();
    await userEvent.tab();
    await expect(copyLink).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(body.getByRole("button", { name: "다른 앱으로 공유" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

/** 첫 항목이 비활성이면 그다음 활성 항목으로 포커스가 간다 (재검증 R1). */
export const DisabledFirstItem: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-2">
        <Button disabled>준비 중</Button>
        <Button>확인</Button>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("button", { name: "확인" })).toHaveFocus());
  },
};

/** 포커스 가능한 요소가 없는 안내 시트: 시트 자체가 포커스를 받고 Tab 이 배경으로 빠지지 않는다 (재검증 R1). */
export const TextOnly: Story = {
  args: {
    title: "안내",
    children: <p className="text-control text-text-secondary">저장한 코스는 찜 목록에서 다시 볼 수 있어요.</p>,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog", { name: "안내" });
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.tab();
    await expect(dialog).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(dialog).toHaveFocus();
  },
};
