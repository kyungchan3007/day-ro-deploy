"use client";

import { useCallback, useMemo, useState } from "react";

import type { SavedCourseCardViewModel } from "../model/saved-course";
import { useDeleteSavedCourse } from "./useDeleteSavedCourse";

export interface UseSavedListScreenValue {
  /** 현재 화면에 표시할 코스 목록(삭제 성공 시 즉시 제거된다). */
  courses: SavedCourseCardViewModel[];
  /** 확인 모달이 열린 대상 코스(없으면 모달 닫힘). */
  pendingDeleteCourse: SavedCourseCardViewModel | null;
  isDeleting: boolean;
  deleteError: Error | null;
  /** 카드의 삭제 버튼이 호출: 해당 코스의 확인 모달을 연다. */
  requestDelete: (courseId: string) => void;
  /** 모달 취소/닫기. */
  cancelDelete: () => void;
  /** 모달 확인: 실제 삭제를 실행한다. */
  confirmDelete: () => void;
}

/**
 * `/saved` 목록 화면의 상호작용 상태를 소유한다.
 * - 목록 state(삭제 성공 시 optimistic 제거)
 * - 삭제 확인 모달의 열림/대상 선택
 * - 삭제 실행 orchestration(useDeleteSavedCourse) 연결
 *
 * UI(위젯/카드/모달)는 이 훅의 값과 핸들러를 바인딩만 하며 상태를 직접 갖지 않는다.
 */
export function useSavedListScreen(
  initialCourses: SavedCourseCardViewModel[],
): UseSavedListScreenValue {
  const [courses, setCourses] = useState(initialCourses);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { deleteCourse, isPending, error, reset } = useDeleteSavedCourse({
    onSuccess: (courseId) => {
      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      setPendingId(null);
    },
  });

  const pendingDeleteCourse = useMemo(
    () => courses.find((course) => course.id === pendingId) ?? null,
    [courses, pendingId],
  );

  const requestDelete = useCallback(
    (courseId: string) => {
      reset();
      setPendingId(courseId);
    },
    [reset],
  );

  const cancelDelete = useCallback(() => {
    if (isPending) return;
    reset();
    setPendingId(null);
  }, [isPending, reset]);

  const confirmDelete = useCallback(() => {
    if (!pendingId) return;
    void deleteCourse(pendingId);
  }, [pendingId, deleteCourse]);

  return {
    courses,
    pendingDeleteCourse,
    isDeleting: isPending,
    deleteError: error,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
