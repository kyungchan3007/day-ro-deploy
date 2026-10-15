"use client";

import { useEffect } from "react";

import { trackEvent } from "@/shared/analytics";
import type { ToastVariant } from "@/shared/ui/toast";
import { CourseSaveRequestError, requestCourseSave } from "../api/save-course";
import { resumePendingCourseSave } from "../lib/resume-course-save";

/** 저장 실패가 로그인 만료(401)인지. */
function isUnauthorizedSaveError(error: unknown): boolean {
  return error instanceof CourseSaveRequestError && error.status === 401;
}

/**
 * 로그인·회원가입 후 코스 화면에 돌아오면 맡겨 둔 저장을 이어서 처리한다(issue #169 · #192).
 * 저장 요청 · 401 판정 · 분석 이벤트를 연결하고, 재개 규칙은 `resumePendingCourseSave` 가 맡는다.
 * @param rev 현재 코스 화면 rev.
 * @param show 토스트 표시.
 */
export function useResumePendingCourseSave(
  rev: string | undefined,
  show: (message: string, variant?: ToastVariant) => void,
) {
  useEffect(() => {
    void resumePendingCourseSave(rev, {
      save: requestCourseSave,
      isUnauthorized: isUnauthorizedSaveError,
      onSaved: (request) => trackEvent("course_saved", { place_count: request.places.length }),
      show,
    });
  }, [rev, show]);
}
