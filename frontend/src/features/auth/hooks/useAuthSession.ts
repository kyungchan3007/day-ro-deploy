"use client";

import { useEffect, useState } from "react";
import { requestAuthSession } from "../api/session";
import type { AuthSession } from "../model/session";

const guestSession: AuthSession = {
  authenticated: false,
  user: null,
};

export interface UseAuthSessionResult extends AuthSession {
  loading: boolean;
}

/**
 * 클라이언트에서 현재 세션을 동기화한다.
 *
 * 루트 홈은 보호 라우트가 아니므로 access token 만료 시 proxy 가 개입하지 않는다.
 * 이 훅은 BFF `/api/auth/me` 를 호출해 필요하면 refresh 를 먼저 수행한 뒤
 * 최신 사용자 정보를 메뉴 UI 에 반영한다.
 */
export function useAuthSession(): UseAuthSessionResult {
  const [session, setSession] = useState<AuthSession>(guestSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const currentSession = await requestAuthSession();
        if (!cancelled) {
          setSession(currentSession);
        }
      } catch {
        if (!cancelled) {
          setSession(guestSession);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...session, loading };
}
