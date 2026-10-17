/**
 * 길안내 공유 결과 안내 (QA #12 · #19, issue #183).
 *
 * 공유가 조용히 끝나면 사용자는 눌렸는지 알 수 없다(PC 무반응).
 * 사용자가 직접 취소한 경우만 조용히 닫고, 그 밖의 결과는 항상 토스트로 알린다.
 */

import { savedStatic } from "@/shared/static/saved";

/** 공유 결과 안내 문구. 원본은 `shared/static/saved`(issue #229). */
export const SHARE_MESSAGES = savedStatic.shareMessages;

/**
 * 시스템 공유(`navigator.share`) 실패 원인을 구분한다.
 * @param error 공유가 던진 값.
 * @returns 사용자가 공유 창을 닫았으면 "cancelled", 그 밖에는 "failed".
 */
export function classifyShareError(error: unknown): "cancelled" | "failed" {
  return error instanceof Error && error.name === "AbortError" ? "cancelled" : "failed";
}

/** 이 브라우저가 시스템 공유를 지원하는지. */
export function canUseSystemShare(nav: Pick<Navigator, "share"> | undefined): boolean {
  return typeof nav?.share === "function";
}
