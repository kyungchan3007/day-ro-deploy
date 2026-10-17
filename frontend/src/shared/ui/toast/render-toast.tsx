import type { ReactNode } from "react";
import { Toast, type ToastVariant } from "./Toast";

export interface RenderToastInput {
  visible: boolean;
  message: ReactNode | null | undefined;
  variant: ToastVariant | null | undefined;
}

/**
 * 보일 때만 Toast 요소, 아니면 null (issue #229).
 * 화면마다 반복하던 `visible && message && variant ? <Toast/> : null` 조건을 한 곳에 둔다.
 * 컴포넌트가 아니라 함수인 이유: ToastViewport 는 자식 개수로 빈 상태를 판단하므로, 숨김일 때 자식 자체가 null 이어야 한다.
 */
export function renderToast({ visible, message, variant }: RenderToastInput): ReactNode {
  return visible && message && variant ? <Toast message={message} variant={variant} /> : null;
}
