import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { Select } from "../../select/Select";

const GU_OPTIONS = [
  { value: "jongno", label: "종로구" },
  { value: "jung", label: "중구" },
  { value: "yongsan", label: "용산구" },
  { value: "mapo", label: "마포구" },
];

const meta = {
  component: Select,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    options: GU_OPTIONS,
    placeholder: "구 선택",
    ariaLabel: "구 선택",
    onChange: () => {},
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState<string | undefined>(ctx.args.value);
      return (
        <div style={{ width: 280 }}>
          <Story args={{ ...ctx.args, value, onChange: setValue }} />
        </div>
      );
    },
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Selected: Story = {
  args: {
    value: "mapo",
  },
};

export const Disabled: Story = {
  args: {
    value: "mapo",
    disabled: true,
  },
};

export const OpensAndSelects: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "구 선택" });
    await userEvent.click(trigger);
    const option = canvas.getByRole("option", { name: "마포구" });
    await userEvent.click(option);
    await expect(trigger).toHaveTextContent("마포구");
  },
};

/** 키보드: ↓ 열기(listbox 포커스) → End → Enter 선택 → 트리거로 포커스 복귀, Esc 닫기(issue #133). */
export const KeyboardNavigation: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole("button", { name: "구 선택" });
    trigger.focus();

    await userEvent.keyboard("{ArrowDown}");
    const listbox = await canvas.findByRole("listbox");
    await waitFor(() => expect(listbox).toHaveFocus());
    const options = canvas.getAllByRole("option");
    await expect(listbox).toHaveAttribute("aria-activedescendant", options[0].id);

    await userEvent.keyboard("{ArrowDown}");
    await expect(listbox).toHaveAttribute("aria-activedescendant", options[1].id);

    await userEvent.keyboard("{End}");
    await expect(listbox).toHaveAttribute("aria-activedescendant", options[3].id);

    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveTextContent("마포구");
    await expect(trigger).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await canvas.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  },
};
