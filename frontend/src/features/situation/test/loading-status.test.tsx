import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getSituationLoadingCopy } from "../model/loading-status";
import { SituationLoadingStatus } from "../ui/SituationLoadingStatus";

/** issue #203 (QA #22): 로딩 화면 안내 문구 A안. */
describe("getSituationLoadingCopy", () => {
  it("생성 중이면 완료 표시 없이 기다림 안내를 돌려준다", () => {
    expect(getSituationLoadingCopy(false)).toEqual({
      mark: null,
      title: "Dayro에서 데이트 코스를 만들고 있어요",
      description: "잠시만 기다려주세요!",
    });
  });

  it("완료되면 ✅ 와 함께 다음 행동 안내를 돌려준다", () => {
    expect(getSituationLoadingCopy(true)).toEqual({
      mark: "✅",
      title: "코스가 완성됐어요!",
      description: "아래 버튼을 눌러 코스를 확인해 보세요",
    });
  });
});

function statusRegion(html: string) {
  const match = html.match(/<div role="status"[^>]*>(.*?)<\/div><div aria-hidden="true"/);
  return match?.[1] ?? "";
}

describe("SituationLoadingStatus", () => {
  it("생성 중에는 상태 영역에 생성 중 문구만 보인다", () => {
    const html = renderToStaticMarkup(<SituationLoadingStatus ready={false} />);
    const region = statusRegion(html);
    expect(region).toContain("Dayro에서 데이트 코스를 만들고 있어요");
    expect(region).not.toContain("코스가 완성됐어요!");
    expect(html).toContain('aria-live="polite"');
  });

  it("완료되면 상태 영역에 ✅ 완료 문구가 보이고 ✅ 는 읽지 않는다", () => {
    const html = renderToStaticMarkup(<SituationLoadingStatus ready />);
    const region = statusRegion(html);
    expect(region).toContain("코스가 완성됐어요!");
    expect(region).toContain('<span aria-hidden="true" class="mr-1">✅</span>');
    expect(region).not.toContain("만들고 있어요");
  });

  it("다른 상태 문구는 보이지 않는 사이저로만 자리를 잡는다(레이아웃 밀림 방지)", () => {
    const html = renderToStaticMarkup(<SituationLoadingStatus ready={false} />);
    expect(html).toMatch(/<div aria-hidden="true" class="invisible[^"]*">.*코스가 완성됐어요!/);
  });
});
