"use client";

import { useToast } from "@/shared/ui";
import type { ToastVariant } from "@/shared/ui";
import type { CoursePlaceItem, CoursePoint } from "@/shared/lib/course-preview";
import { buildLoginRedirectPath } from "@/shared/lib/login-redirect";
import { useCoursePreviewOrder } from "@/shared/lib/useCoursePreviewOrder";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SavedCourseDetailViewModel } from "../model/saved-course-detail";
import { useCourseShareActions } from "./useCourseShareActions";
import { buildSavedCourseUpdateRequest } from "../model/saved-course-detail";
import {
  requestSavedCourseUpdate,
  SavedCourseUpdateRequestError,
} from "../api/update-saved-course";

export interface UseSavedCourseDetailScreenValue {
  places: CoursePlaceItem[];
  isEmpty: boolean;
  points: CoursePoint[];
  isReordered: boolean;
  reorder: (from: number, to: number) => void;
  resetOrder: () => void;
  toastVisible: boolean;
  toastMessage: string | null;
  toastVariant: ToastVariant | null;
  /** "길안내 공유": 공유 방법 시트를 연다(장소가 부족하면 안내). */
  shareCourse: () => Promise<void>;
  shareSheetOpen: boolean;
  canSystemShare: boolean;
  closeShareSheet: () => void;
  /** 시트 "링크 복사". */
  copyShareLink: () => Promise<void>;
  /** 시트 "다른 앱으로 공유". 실패하면 링크 복사로 대신한다. */
  shareViaSystem: () => Promise<void>;
  completeEdit: () => Promise<void>;
  canCompleteEdit: boolean;
}

/**
 * 저장 코스 상세 화면 orchestration 훅.
 * 공통 순서 변경 규칙과 공유/수정완료 CTA 정책을 묶어 saved widget 에 제공한다.
 * 공유 동작(방법 시트 · 링크 복사 · 시스템 공유)은 `useCourseShareActions` 가 맡는다(issue #183 · #192).
 */
export function useSavedCourseDetailScreen(
  course: SavedCourseDetailViewModel,
  sharerName: string | null = null,
): UseSavedCourseDetailScreenValue {
  const { places, points, isEmpty, isReordered, reorder, resetOrder, commitOrder } =
    useCoursePreviewOrder<CoursePlaceItem>(course.places);
  const [saving, setSaving] = useState(false);
  const { toast, visible, show } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const shareActions = useCourseShareActions({ points, sharerName, show });

  const completeEdit = async () => {
    if (!isReordered || saving) {
      return;
    }

    setSaving(true);

    try {
      const request = buildSavedCourseUpdateRequest(course, places);
      await requestSavedCourseUpdate(course.id, request);
      commitOrder();
      show("코스 수정을 완료했어요.", "success");
    } catch (error) {
      if (
        error instanceof SavedCourseUpdateRequestError &&
        error.status === 401
      ) {
        router.push(buildLoginRedirectPath(pathname));
        return;
      }

      show(
        error instanceof Error
          ? error.message
          : "저장한 코스를 수정하지 못했습니다.",
        "info",
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    places,
    isEmpty,
    points,
    isReordered,
    reorder,
    resetOrder,
    toastVisible: visible,
    toastMessage: toast?.message ?? null,
    toastVariant: toast?.variant ?? null,
    ...shareActions,
    completeEdit,
    canCompleteEdit: isReordered && !saving,
  };
}
