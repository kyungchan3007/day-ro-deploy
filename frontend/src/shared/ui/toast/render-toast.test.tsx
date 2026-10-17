import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { renderToast } from "./render-toast";

describe("renderToast (issue #229)", () => {
  it("보이고 · 문구 · 종류가 모두 있으면 Toast 요소", () => {
    expect(isValidElement(renderToast({ visible: true, message: "저장됐어요", variant: "success" }))).toBe(true);
  });

  it("하나라도 없으면 null → ToastViewport 가 빈 상자를 그리지 않는다", () => {
    expect(renderToast({ visible: false, message: "저장됐어요", variant: "success" })).toBeNull();
    expect(renderToast({ visible: true, message: "", variant: "success" })).toBeNull();
    expect(renderToast({ visible: true, message: "저장됐어요", variant: null })).toBeNull();
  });
});
