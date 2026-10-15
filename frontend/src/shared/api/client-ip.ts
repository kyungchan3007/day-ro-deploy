/**
 * 백엔드 IP당 제한이 사람별로 걸리도록 넘길 실제 접속 IP (BFF 공용, issue #219 · #224).
 * Workers 를 거치면 백엔드에는 Workers IP 로 보이므로 X-Forwarded-For 로 전달한다.
 * Cloudflare 앞단이면 `cf-connecting-ip`, 그 밖은 `x-forwarded-for` 첫 값 · `x-real-ip`.
 */
export function readClientIp(headers: Headers): string | null {
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) {
    return cf;
  }
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) {
    return forwarded;
  }
  return headers.get("x-real-ip")?.trim() || null;
}
