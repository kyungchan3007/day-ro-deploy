"use client";

import { useRouter } from "next/navigation";

export interface UseSavedEmptyValue {
  /** '코스 만들러 가기' CTA: 코스 생성 진입으로 이동한다. */
  goToCreateCourse: () => void;
}

/**
 * 찜한 코스 빈 상태의 이동 정책을 소유한다.
 * UI(SavedEmpty)는 이 핸들러를 버튼에 바인딩만 하고 router를 직접 다루지 않는다.
 */
export function useSavedEmpty(): UseSavedEmptyValue {
  const router = useRouter();

  return {
    goToCreateCourse: () => {
      router.push("/course/new");
    },
  };
}
