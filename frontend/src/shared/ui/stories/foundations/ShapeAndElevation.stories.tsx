import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RADIUS_SCALE, SHADOW_SCALE } from "../../tokens/token-catalog";
import { readToken, TokenName, TokenPage, TokenSection } from "./token-doc";

function ShapeAndElevationDoc() {
  return (
    <TokenPage title="Radius · Shadow" description="모서리 둥글기와 그림자 단계.">
      <TokenSection title="Radius">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {RADIUS_SCALE.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <span
                className="h-16 border border-primary bg-primary-surface"
                style={{ borderRadius: `var(${token.name})` }}
              />
              <TokenName name={token.name} utility={token.utility} />
              <span className="text-caption text-text-muted">
                {readToken(token.name)} · {token.usage}
              </span>
            </div>
          ))}
        </div>
      </TokenSection>
      <TokenSection title="Shadow">
        <div className="grid grid-cols-2 gap-6 bg-surface-subtle p-4 sm:grid-cols-3">
          {SHADOW_SCALE.map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <span className="h-16 rounded-base bg-surface" style={{ boxShadow: `var(${token.name})` }} />
              <TokenName name={token.name} utility={token.utility} />
              <span className="text-caption text-text-muted">{token.usage}</span>
            </div>
          ))}
        </div>
      </TokenSection>
    </TokenPage>
  );
}

const meta = {
  component: ShapeAndElevationDoc,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ShapeAndElevationDoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadiusAndShadow: Story = {};
