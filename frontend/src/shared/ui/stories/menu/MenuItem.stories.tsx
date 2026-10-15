import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { HeartIcon } from "../../icon";
import { MenuItem } from "../../menu/MenuItem";

const meta = {
  component: MenuItem,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
  args: {
    icon: <HeartIcon size={18} className="text-primary" />,
    label: "찜한 코스",
  },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsButton: Story = {
  args: {
    onClick: fn(),
  },
};

export const AsLink: Story = {
  args: {
    href: "/saved",
  },
  play: async ({ canvas }) => {
    // next.config trailingSlash: true → 실제 앱처럼 끝 슬래시가 붙는다(Storybook 10.6 부터 반영).
    await expect(canvas.getByRole("link", { name: "찜한 코스" })).toHaveAttribute(
      "href",
      "/saved/",
    );
  },
};

/**
 * 링크이면서 클릭을 가로채는 경우(issue #181 메뉴 로그인 · #192 story 갱신).
 * href 는 접근성 · 새 탭 열기용으로 유지하고, onClick 이 이벤트를 받아 이동 방식을 정한다.
 */
export const AsLinkWithIntercept: Story = {
  args: {
    href: "/login",
    label: "로그인",
    onClick: fn((event) => event.preventDefault()),
  },
  play: async ({ args, canvas, userEvent }) => {
    const link = canvas.getByRole("link", { name: "로그인" });
    await expect(link).toHaveAttribute("href", "/login/");
    await userEvent.click(link);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
