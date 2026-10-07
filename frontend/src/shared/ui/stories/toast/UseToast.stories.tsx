import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Button } from "../../button";
import { Toast } from "../../toast/Toast";
import { useToast } from "../../toast/useToast";

function ToastDemo() {
  const { toast, visible, show, hide } = useToast({ duration: 5000 });

  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => show("코스가 저장되었어요", "success")}
        >
          성공 토스트
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => show("새 추천 코스를 불러왔어요", "info")}
        >
          안내 토스트
        </Button>
        <Button variant="ghost" size="sm" onClick={hide}>
          닫기
        </Button>
      </div>

      <div className="min-h-10">
        {visible && toast ? (
          <Toast message={toast.message} variant={toast.variant} />
        ) : null}
      </div>
    </div>
  );
}

const meta = {
  component: ToastDemo,
  tags: ["ai-generated"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Demo: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "성공 토스트" }));
    await expect(await canvas.findByRole("status")).toHaveTextContent(
      "코스가 저장되었어요",
    );
  },
};
