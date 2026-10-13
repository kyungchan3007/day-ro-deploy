import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent } from "storybook/test";

import { SearchField } from "../../field/SearchField";

const meta = {
  component: SearchField,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    value: "",
    placeholder: "행정동을 입력하세요",
    ariaLabel: "행정동 검색",
    onChange: () => {},
  },
  decorators: [
    (Story, ctx) => {
      const [value, setValue] = useState(ctx.args.value ?? "");
      return (
        <div style={{ width: 300 }}>
          <Story args={{ ...ctx.args, value, onChange: setValue }} />
        </div>
      );
    },
  ],
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithValue: Story = {
  args: {
    value: "연남",
  },
};

export const TypesAndClears: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("searchbox", { name: "행정동 검색" });
    await userEvent.type(input, "홍대");
    await expect(input).toHaveValue("홍대");
    const clear = canvas.getByRole("button", { name: "검색어 지우기" });
    await userEvent.click(clear);
    await expect(input).toHaveValue("");
  },
};
