"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { requestWithdraw } from "../api/withdraw";

export interface UseWithdrawResult {
  /** 회원탈퇴를 실행한다. 성공 시 caller 가 완료 UI를 열 수 있다. */
  withdraw: () => Promise<boolean>;
  /** 요청 진행 중 여부. */
  pending: boolean;
  /** 직전 요청 실패 여부. */
  error: boolean;
  /** 에러 표시를 초기화한다. */
  reset: () => void;
  /** 탈퇴 완료 acknowledgement 후 이동을 처리한다. */
  finish: () => void;
}

/**
 * 회원탈퇴 흐름 훅 (features/auth 전용).
 *
 * BFF 호출(api)·진행 상태·성공 후 라우팅 갱신 책임을 UI 밖으로 분리한다.
 * 완료 모달 open/close 자체는 UI 흐름이므로 caller 가 소유한다.
 */
export function useWithdraw(): UseWithdrawResult {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const reset = useCallback(() => setError(false), []);

  const withdraw = useCallback(async () => {
    setPending(true);
    setError(false);

    try {
      await requestWithdraw();
      setPending(false);
      return true;
    } catch {
      setError(true);
      setPending(false);
      return false;
    }
  }, []);

  const finish = useCallback(() => {
    router.replace("/");
    router.refresh();
  }, [router]);

  return { withdraw, pending, error, reset, finish };
}
