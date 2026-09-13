import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Container } from "../../layout/Container";

const meta = {
  component: Container,
  tags: ["ai-generated"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="bg-frame py-10">
      <Container>
        <div className="rounded-xl bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-strong">기본 컨테이너</h2>
          <p className="mt-2 text-sm text-text-muted">
            640px 중앙 정렬과 반응형 좌우 패딩을 확인하는 예제입니다.
          </p>
        </div>
      </Container>
    </div>
  ),
};

export const AsSection: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="bg-frame py-10">
      <Container as="section" className="rounded-xl bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-strong">section 렌더</h2>
      </Container>
    </div>
  ),
};
