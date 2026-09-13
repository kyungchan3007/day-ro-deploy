import { redirect } from "next/navigation";

import { resolveAuthSessionForServerComponent } from "../../../shared/api/server-auth-session";

/**
 * saved 보호 라우트의 서버 인증 가드.
 * 현재 세션이 없으면 로그인으로 보내고, 있으면 후속 SSR 준비를 계속 진행한다.
 */
export async function requireSavedAuth(nextPath: string) {
  const session = await resolveAuthSessionForServerComponent();

  if (!session.authenticated || !session.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
}
