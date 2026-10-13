import type { ReactNode } from "react";
import { notFound } from "next/navigation";

/**
 * 개발용 UI 미리보기는 운영에서 노출하지 않는다(issue #139 S11).
 * 운영 빌드에서는 하위 경로 전체를 404 로 만든다(issue #146, 이전 `proxy.ts` 역할).
 */
export default function UiPreviewLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return children;
}
