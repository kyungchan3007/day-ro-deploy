import { HTML_LIMITED_BOT_UA_RE_STRING } from "next/dist/shared/lib/router/utils/is-bot";

/**
 * 메타데이터를 스트리밍하지 않고 `<head>` 에 담아 보내야 하는 미리보기 수집기 UA (issue #187).
 *
 * Next 16 은 동적 페이지의 메타데이터를 본문 쪽으로 스트리밍하고, 기본 봇 목록에 있는 UA 에만 `<head>` 로 보낸다.
 * 국내 메신저 수집기는 기본 목록에 없어 og 태그를 못 읽을 수 있으므로 Next 기본 목록에 더한다.
 * - kakaotalk-scrap: 카카오톡 링크 미리보기
 * - Daumoa: 다음 검색 · 카카오 수집기
 * - TelegramBot: 텔레그램 링크 미리보기
 * `next.config.ts` 의 `htmlLimitedBots` 가 사용한다(설정 파일에서 import 하므로 경로 별칭 없이 둔다).
 */
export const MESSENGER_PREVIEW_BOT_UA_PATTERNS = ["kakaotalk-scrap", "Daumoa", "TelegramBot"];

export const HTML_LIMITED_BOTS = new RegExp(
  [HTML_LIMITED_BOT_UA_RE_STRING, ...MESSENGER_PREVIEW_BOT_UA_PATTERNS].join("|"),
  "i",
);
