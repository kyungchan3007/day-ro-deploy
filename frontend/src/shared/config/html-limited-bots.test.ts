import { describe, expect, it } from "vitest";

import { HTML_LIMITED_BOTS } from "./html-limited-bots";

describe("HTML_LIMITED_BOTS", () => {
  it.each([
    "facebookexternalhit/1.1; kakaotalk-scrap/1.0; +https://devtalk.kakao.com/",
    "Mozilla/5.0 (compatible; Daumoa/4.0)",
    "TelegramBot (like TwitterBot)",
    "Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0",
  ])("미리보기 수집기 %s 는 메타를 head 로 받는다", (ua) => {
    expect(HTML_LIMITED_BOTS.test(ua)).toBe(true);
  });

  it("일반 모바일 브라우저 · 카카오톡 인앱 브라우저는 스트리밍 그대로", () => {
    expect(
      HTML_LIMITED_BOTS.test(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 KAKAOTALK 10.8.0",
      ),
    ).toBe(false);
  });
});
