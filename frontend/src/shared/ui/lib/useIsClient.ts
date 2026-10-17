"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * hydration-safe 클라이언트 감지.
 * 서버 렌더·hydration 중에는 false, 클라이언트 mount 후 true 를 돌려준다(portal 등 클라 전용 렌더용).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
