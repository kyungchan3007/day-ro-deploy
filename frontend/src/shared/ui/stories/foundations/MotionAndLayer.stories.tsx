import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LAYER_TOKENS, MOTION_TOKENS } from "../../tokens/token-catalog";
import { readToken, TokenName, TokenPage, TokenSection } from "./token-doc";

function TokenTable({ tokens }: { tokens: { name: string; usage: string }[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {tokens.map((token) => (
        <li key={token.name} className="flex items-center gap-4 py-2.5">
          <span className="w-40 shrink-0">
            <TokenName name={token.name} />
          </span>
          <code className="w-44 shrink-0 truncate text-caption text-text-muted">{readToken(token.name)}</code>
          <span className="text-label text-text-secondary">{token.usage}</span>
        </li>
      ))}
    </ul>
  );
}

function MotionAndLayerDoc() {
  return (
    <TokenPage
      title="Motion · Layer"
      description="전환 시간과 쌓임 순서. CSS module 은 var(--duration-*) · var(--z-*), Tailwind 는 duration-(--duration-base) · z-(--z-modal) 로 쓴다."
    >
      <TokenSection title="Motion">
        <TokenTable tokens={MOTION_TOKENS} />
      </TokenSection>
      <TokenSection title="Layer (z-index)">
        <TokenTable tokens={LAYER_TOKENS} />
      </TokenSection>
    </TokenPage>
  );
}

const meta = {
  component: MotionAndLayerDoc,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MotionAndLayerDoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MotionAndLayer: Story = {};
