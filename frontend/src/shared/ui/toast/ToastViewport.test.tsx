import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Toast } from "./Toast";
import { ToastViewport } from "./ToastViewport";

// issue #194: 전 화면 토스트를 상단 공용 위치(ToastViewport)에 띄운다.
describe("ToastViewport", () => {
  it("토스트가 없으면 아무것도 렌더하지 않는다", () => {
    expect(renderToStaticMarkup(<ToastViewport />)).toBe("");
    expect(renderToStaticMarkup(<ToastViewport>{null}{false}</ToastViewport>)).toBe("");
  });

  it("토스트를 공용 위치 컨테이너 안에 렌더한다", () => {
    const html = renderToStaticMarkup(
      <ToastViewport>
        <Toast message="코스가 저장되었습니다." />
      </ToastViewport>,
    );
    expect(html).toContain("data-toast-viewport");
    expect(html).toContain('role="status"');
    expect(html).toContain("코스가 저장되었습니다.");
  });

  it("여러 토스트는 순서대로 함께 쌓는다", () => {
    const html = renderToStaticMarkup(
      <ToastViewport>
        <Toast message="첫 번째" variant="info" />
        <Toast message="두 번째" />
      </ToastViewport>,
    );
    expect(html.indexOf("첫 번째")).toBeLessThan(html.indexOf("두 번째"));
    expect(html.match(/role="status"/g)).toHaveLength(2);
  });
});
