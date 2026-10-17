"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearGuestVisitMarker } from "@/shared/lib/guest-visit-marker";
import { buildStartScreenPath } from "@/shared/lib/login-redirect";
import { requestLogout } from "../api/logout";

export interface UseLogoutResult {
  /**
   * 로그아웃을 실행한다. 성공 시 첫 화면(`/` = 비회원 시작 화면)으로 이동한다(issue #244).
   * @param nextPath 다시 로그인하면 돌아갈 경로(로그아웃 직전 화면, issue #181). 시작 화면 카카오 로그인이 받아 쓴다.
   */
  logout: (nextPath?: string | null) => Promise<void>;
  /** 요청 진행 중 여부(버튼 비활성·라벨 전환용). */
  pending: boolean;
  /** 직전 요청 실패 여부(UI 가 문구를 매핑해 노출). */
  error: boolean;
  /** 에러 표시를 초기화한다(모달 재오픈/닫기 시). */
  reset: () => void;
}

/**
 * 로그아웃 흐름 훅 (features/auth 전용).
 *
 * BFF 호출(api)·진행 상태·라우팅 책임을 UI 밖으로 분리한다.
 *   - 성공: 세션 쿠키 · 이번 탭 둘러보기 표시가 지워졌으므로 `/` 로 이동(replace)해 시작 화면을 보여주고(issue #244),
 *     직전 화면을 next 로 함께 넘겨 다시 로그인하면 그 화면으로 돌아오게 한다(issue #181),
 *     서버 컴포넌트가 비로그인 상태로 다시 실행되도록 refresh 한다.
 *   - 실패: BFF 는 쿠키를 항상 정리하지만 네트워크 오류 등은 error 로 노출해 재시도를 맡긴다.
 *
 * 사용자에게 보여줄 문구는 UI(static)가 소유하므로 여기서는 boolean 상태만 노출한다.
 */
export function useLogout(): UseLogoutResult {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const reset = useCallback(() => setError(false), []);

  const logout = useCallback(async (nextPath?: string | null) => {
    setPending(true);
    setError(false);
    try {
      await requestLogout();
      // 이번 탭 둘러보기 표시도 지워 `/` 가 시작 화면이 되게 한다(issue #244).
      clearGuestVisitMarker();
      // 성공 시엔 화면 전환이 이어지므로 pending 을 유지해 버튼을 잠근 상태로 둔다.
      router.replace(buildStartScreenPath(nextPath));
      router.refresh();
    } catch {
      setError(true);
      setPending(false);
    }
  }, [router]);

  return { logout, pending, error, reset };
}
