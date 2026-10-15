import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { findTokenViolations, isGuardTarget } from "./design-token-guard";

const SRC = path.resolve(__dirname, "../../..");

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe("디자인 토큰 우회 검사 규칙", () => {
  it("임의 글자 크기 · 색 · radius 를 찾는다 (한 줄에 규칙별 1건)", () => {
    const found = findTokenViolations(
      "a.tsx",
      [
        '<p className="text-[13px] text-text">',
        '<div className="bg-[#FEE500] rounded-[12px]">',
        '<span className="text-white bg-red-50">',
        'const c = "#7800e9";',
      ].join("\n"),
    ).map((v) => v.rule);
    expect(found).toEqual([
      "arbitrary-font-size",
      "raw-hex-color",
      "arbitrary-radius",
      "raw-palette-class",
      "raw-hex-color",
    ]);
  });

  it("css module 의 값 직접 사용을 찾는다", () => {
    const found = findTokenViolations(
      "a.module.css",
      [
        "font-size: 13px;",
        "color: #ffffff;",
        "background: rgba(0, 0, 0, 0.45);",
        "border-radius: 8px;",
        "z-index: 40;",
      ].join("\n"),
    ).map((v) => v.rule);
    expect(found).toEqual([
      "raw-font-size",
      "raw-hex-color",
      "raw-rgb-color",
      "raw-radius",
      "raw-z-index",
    ]);
  });

  it("z-index class · 방향별 radius · 인라인 스타일 숫자를 찾는다 (검증 리포트 F2)", () => {
    const found = findTokenViolations(
      "a.tsx",
      [
        '<div className="z-50 rounded-t-[24px]" />',
        '<div className="z-[40]" />',
        "<div style={{ fontSize: 13, borderRadius: 12, zIndex: 40 }} />",
      ].join("\n"),
    ).map((v) => v.rule);
    expect(found).toEqual(["arbitrary-radius", "raw-z-class", "raw-z-class", "raw-inline-style"]);
  });

  it("z 유틸은 30 이상 · 임의값만 찾는다 (재검증 R2)", () => {
    const rules = (className: string) =>
      findTokenViolations("a.tsx", `<div className="${className}" />`).map((v) => v.rule);
    for (const flagged of ["z-30", "z-31", "z-90", "z-100", "z-999", "z-[5]"]) {
      expect(rules(flagged), flagged).toEqual(["raw-z-class"]);
    }
    for (const allowed of ["z-0", "z-10", "z-20", "z-29", "z-(--z-modal)"]) {
      expect(rules(allowed), allowed).toEqual([]);
    }
  });

  it("css 여러 값 · shorthand 의 색 · radius 를 찾는다 (검증 리포트 F2)", () => {
    const found = findTokenViolations(
      "a.module.css",
      ["border: 1px solid #fff;", "color: white;", "border-radius: 24px 24px 0 0;", "border-top-left-radius: 8px;"].join(
        "\n",
      ),
    ).map((v) => v.rule);
    expect(found).toEqual(["raw-hex-color", "raw-named-color", "raw-radius", "raw-radius"]);
  });

  it("주석 속 예시 · 앵커 링크 · 컴포넌트 안 z-10 은 통과시킨다 (검증 리포트 F3)", () => {
    const source = [
      "// replace text-[13px] with text-label",
      "/* color: #ffffff; z-50 */",
      '<a href="#abc">link</a>',
      '<div className="relative z-10" />',
      'const url = "https://day-ro.com/#faq";',
    ].join("\n");
    expect(findTokenViolations("a.tsx", source)).toEqual([]);
    expect(findTokenViolations("a.tsx", '<a href = "#abc">link</a>')).toEqual([]);
    expect(findTokenViolations("a.module.css", "/* font-size: 13px; */\n.a { color: var(--color-text); }")).toEqual([]);
  });

  it("문자열 안의 // 는 주석이 아니어서 뒤 위반을 놓치지 않는다 (재검증 R3)", () => {
    const found = findTokenViolations(
      "a.tsx",
      'const label = "a // b"; const node = <div className="text-[13px]" />;',
    ).map((v) => v.rule);
    expect(found).toEqual(["arbitrary-font-size"]);
    // JSX 글자 속 따옴표가 다음 줄 검사를 막지 않는다.
    const next = findTokenViolations("a.tsx", "<p>It's fine</p>\n<p className=\"text-[11px]\" />").map((v) => v.line);
    expect(next).toEqual([2]);
  });

  it("토큰 사용 · 이슈 번호(#227) · 50% 원형은 통과시킨다", () => {
    const found = findTokenViolations(
      "a.module.css",
      [
        "font-size: var(--text-label);",
        "border-radius: 50%;",
        "/* issue #227 */",
        "z-index: var(--z-sheet);",
        "background: color-mix(in srgb, var(--color-on-primary) 55%, transparent);",
      ].join("\n"),
    );
    expect(found).toEqual([]);
    expect(findTokenViolations("a.tsx", '<p className="text-label text-on-primary">#227</p>')).toEqual([]);
  });

  it("규칙 단위 예외 파일은 그 규칙만 빼고 검사한다", () => {
    expect(isGuardTarget("features/auth/ui/KakaoLoginButton.tsx")).toBe(true);
    const kakao = findTokenViolations(
      "features/auth/ui/KakaoLoginButton.tsx",
      '<span className="bg-[#FEE500] text-[15px] text-[rgba(0,0,0,0.85)]" />',
    ).map((v) => v.rule);
    expect(kakao).toEqual(["arbitrary-font-size"]);
  });

  it("테스트 · 스토리 · 예외 파일은 검사하지 않는다", () => {
    expect(isGuardTarget("shared/ui/button/Button.tsx")).toBe(true);
    expect(isGuardTarget("shared/ui/button/Button.test.ts")).toBe(false);
    expect(isGuardTarget("shared/ui/stories/button/Button.stories.tsx")).toBe(false);
    expect(isGuardTarget("app/globals.css")).toBe(false);
    expect(isGuardTarget("e2e/home/home.spec.ts")).toBe(false);
  });
});

describe("src 전체 디자인 토큰 사용", () => {
  it("화면 코드가 토큰 대신 값을 직접 쓰지 않는다", () => {
    const violations = listFiles(SRC)
      .map((full) => path.relative(SRC, full).split(path.sep).join("/"))
      .filter(isGuardTarget)
      .flatMap((file) => findTokenViolations(file, readFileSync(path.join(SRC, file), "utf8")));

    const report = violations.map((v) => `${v.file}:${v.line} [${v.rule}] ${v.text} → ${v.hint}`);
    expect(report).toEqual([]);
  });
});
