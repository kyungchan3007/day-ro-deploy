import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth", () => ({ AccountNavBar: () => null }));
vi.mock("@/features/course-result", () => ({
  useCourseSelection: () => ({
    selected: [],
    toggle: vi.fn(),
    reset: vi.fn(),
    orderOf: () => null,
    isValid: false,
    isFull: false,
    hint: "",
    max: 4,
  }),
  useCourseResult: () => ({ candidates: [], isEmpty: false }),
  useCourseReroll: () => ({ rerolling: false, handleReroll: vi.fn() }),
}));

import { CourseResultScreen } from "../CourseResultScreen";

function rerollButtonClass(html: string) {
  const match = html.match(/<button[^>]*class="([^"]*)"[^>]*>(?:(?!<\/button>).)*다른 코스 보기/);
  return match?.[1] ?? "";
}

/** issue #206 (QA #10): "다른 코스 보기" 버튼과 "남은 N회" 시각 구분. */
describe("CourseResultScreen 다른 코스 보기", () => {
  it("다른 코스 보기는 진보라(primary) 버튼이다", () => {
    const html = renderToStaticMarkup(<CourseResultScreen candidates={[]} remainingRetries={5} />);
    const className = rerollButtonClass(html);
    expect(className).toContain("bg-primary");
    expect(className).not.toContain("bg-surface-subtle");
  });

  it("남은 횟수는 버튼이 아닌 글자로, 숫자를 따로 강조한다", () => {
    const html = renderToStaticMarkup(<CourseResultScreen candidates={[]} remainingRetries={5} />);
    expect(html).toMatch(/<span class="[^"]*retryCount[^"]*" aria-live="polite">남은 <span class="[^"]*retryCountNumber[^"]*">5<\/span>회<\/span>/);
    expect(html).not.toMatch(/<button[^>]*>[^<]*남은/);
  });

  it("한도 소진 시 버튼은 흐리게 표시되지만 눌러서 안내를 받을 수 있다", () => {
    const html = renderToStaticMarkup(
      <CourseResultScreen candidates={[]} remainingRetries={0} retryExhausted />,
    );
    const className = rerollButtonClass(html);
    expect(className).toContain("aria-disabled:opacity-40");
    expect(html).toMatch(/<button[^>]*aria-disabled="true"[^>]*>(?:(?!<\/button>).)*다른 코스 보기/);
  });
});
