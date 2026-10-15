import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import * as icons from "../../icon/icons";

type IconComponent = (props: { size?: number }) => React.ReactNode;

function IconGallery({ size = 24 }: { size?: number }) {
  const entries = Object.entries(icons) as [string, IconComponent][];
  return (
    <ul className="grid grid-cols-3 gap-3 p-6 text-text-strong sm:grid-cols-6">
      {entries.map(([name, Icon]) => (
        <li key={name} className="flex flex-col items-center gap-2 rounded-base border border-border p-3">
          <Icon size={size} />
          <code className="text-caption text-text-muted">{name.replace(/Icon$/, "")}</code>
        </li>
      ))}
    </ul>
  );
}

/** 아이콘은 currentColor 를 따른다 — 부모 글자색(text-*)으로 색을 바꾼다. */
const meta = {
  component: IconGallery,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: { size: 24 },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};

export const Small: Story = { args: { size: 16 } };
