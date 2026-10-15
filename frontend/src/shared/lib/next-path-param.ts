/**
 * Route Handler 로 넘기는 복귀 경로(`next`) 쿼리 값 인코딩 (issue #200).
 *
 * 운영(Cloudflare Workers · OpenNext)의 Route Handler 는 쿼리의 `%26`(&) 을 미리 풀어 버려,
 * `next=/course/new/?step=purpose&rev=abc` 의 `&rev=abc` 가 별도 파라미터로 떨어져 나간다.
 * 그래서 API 로 넘길 때는 `&` · `%` · `/` 가 없는 base64url(UTF-8) 로 감싸고, 받는 쪽에서 되돌린다.
 * 되돌린 값의 안전성(내부 경로 여부)은 호출부가 `sanitizeLoginNextPath` 로 다시 검증한다.
 */

const ENCODED_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_ENCODED_LENGTH = 4096;

/** 복귀 경로를 쿼리에 안전한 base64url 로 감싼다. */
export function encodeNextPathParam(path: string): string {
  const bytes = new TextEncoder().encode(path);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * 쿼리 값을 복귀 경로로 되돌린다.
 * - `/` 로 시작하면 이전 평문 형식으로 그대로 받는다(배포 중 이전 링크 · 폼과 섞여도 깨지지 않게).
 * - 그 밖에는 base64url 로 보고 되돌리며, 형식이 틀리면 null.
 */
export function decodeNextPathParam(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value.startsWith("/")) {
    return value;
  }
  if (value.length > MAX_ENCODED_LENGTH || !ENCODED_PATTERN.test(value)) {
    return null;
  }
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
