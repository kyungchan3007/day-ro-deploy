import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { COLOR_GROUPS, PALETTE_RAMPS } from "../../tokens/token-catalog";
import { readToken, TokenName, TokenPage, TokenSection } from "./token-doc";

function Swatch({ name, usage }: { name: string; usage?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="size-10 shrink-0 rounded-base border border-border"
        style={{ background: `var(${name})` }}
      />
      <span className="flex min-w-0 flex-col">
        <TokenName name={name} />
        <span className="text-caption text-text-muted">
          {readToken(name)}
          {usage ? ` · ${usage}` : ""}
        </span>
      </span>
    </div>
  );
}

function ColorsDoc() {
  return (
    <TokenPage
      title="Colors"
      description="화면 코드는 의미 토큰(bg-primary · text-text-muted …)만 쓴다. 원본 램프는 의미 토큰을 정의할 때만 쓴다."
    >
      {COLOR_GROUPS.map((group) => (
        <TokenSection key={group.title} title={group.title}>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.tokens.map((token) => (
              <Swatch key={token.name} name={token.name} usage={token.usage} />
            ))}
          </div>
        </TokenSection>
      ))}
      {PALETTE_RAMPS.map((ramp) => (
        <TokenSection key={ramp.title} title={`Palette · ${ramp.title}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ramp.steps.map((step) => (
              <Swatch key={step} name={`${ramp.prefix}${step}`} />
            ))}
          </div>
        </TokenSection>
      ))}
    </TokenPage>
  );
}

const meta = {
  component: ColorsDoc,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ColorsDoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colors: Story = {};
