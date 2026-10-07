import "server-only";

import { requireAuthSessionForServerComponent } from "../../../shared/api/server-auth-session";

/**
 * saved 보호 라우트의 서버 인증 가드.
 * refresh token 만 남아 있으면 세션 복구 후 돌아오고, 세션이 없으면 로그인으로 보낸다.
 * 있으면 후속 SSR 준비를 계속 진행한다.
 */
export async function requireSavedAuth(nextPath: string) {
  await requireAuthSessionForServerComponent(nextPath);
}
