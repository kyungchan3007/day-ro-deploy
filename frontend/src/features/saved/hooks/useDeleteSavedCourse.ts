"use client";

import { useCallback, useRef, useState } from "react";
import type { CourseDeleteResponse } from "../../../shared/api/openapi/dayro.openapi";
import { requestSavedCourseDelete } from "../api/delete-saved-course";

export interface UseDeleteSavedCourseOptions {
  /** API 성공 후 목록 소유자가 해당 courseId를 제거하는 데 사용한다. */
  onSuccess?: (courseId: string, response: CourseDeleteResponse) => void;
}

export interface UseDeleteSavedCourseValue {
  deleteCourse: (courseId: string) => Promise<boolean>;
  isPending: boolean;
  error: Error | null;
  /** 직전 삭제 오류를 지운다(모달 재오픈/취소 시 stale error 방지). */
  reset: () => void;
}

/** 저장 코스 삭제의 중복 실행 방지, pending/error, 성공 통지를 소유한다. */
export function useDeleteSavedCourse(
  options: UseDeleteSavedCourseOptions = {},
): UseDeleteSavedCourseValue {
  const { onSuccess } = options;
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteCourse = useCallback(
    async (courseId: string) => {
      if (pendingRef.current) {
        return false;
      }

      pendingRef.current = true;
      setIsPending(true);
      setError(null);

      try {
        const response = await requestSavedCourseDelete(courseId);
        onSuccess?.(courseId, response);
        return true;
      } catch (caught) {
        const nextError =
          caught instanceof Error
            ? caught
            : new Error("저장한 코스를 삭제하지 못했습니다.");
        setError(nextError);
        return false;
      } finally {
        pendingRef.current = false;
        setIsPending(false);
      }
    },
    [onSuccess],
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { deleteCourse, isPending, error, reset };
}
