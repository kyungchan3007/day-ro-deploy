import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TYPE_SCALE } from "../../tokens/token-catalog";
import { readToken, TokenName, TokenPage, TokenSection } from "./token-doc";

/** rem 값을 px 로 함께 보여준다(기준 16px). */
function remToLabel(value: string): string {
  const rem = Number.parseFloat(value);
  return Number.isNaN(rem) ? value : `${rem * 16}px`;
}

function TypographyDoc() {
  return (
    <TokenPage
      title="Typography"
      description="글자 크기 단계. 행간은 부모를 따른다(필요하면 leading-* 를 함께 쓴다). text-[13px] 같은 임의값은 검사 테스트에서 막는다."
    >
      <TokenSection title="Scale">
        <ul className="flex flex-col divide-y divide-border">
          {TYPE_SCALE.map((token) => (
            <li key={token.name} className="flex items-center gap-4 py-3">
              <span className="w-36 shrink-0">
                <TokenName name={token.name} utility={token.utility} />
              </span>
              <span className="w-12 shrink-0 text-caption text-text-muted">{remToLabel(readToken(token.name))}</span>
              <span className="min-w-0 flex-1 truncate font-semibold" style={{ fontSize: `var(${token.name})` }}>
                데이로 코스 추천 {token.usage}
              </span>
            </li>
          ))}
        </ul>
      </TokenSection>
    </TokenPage>
  );
}

const meta = {
  component: TypographyDoc,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TypographyDoc>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Typography: Story = {};
