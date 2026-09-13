"use client";

import { useToast } from "@/shared/ui";
import type { ToastVariant } from "@/shared/ui";
import {
  isSameCourseOrder,
  reorderCoursePlaces,
  toCoursePreviewPoints,
  type CoursePlaceItem,
  type CoursePoint,
} from "@/shared/lib/course-preview";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SavedCourseDetailViewModel } from "../model/saved-course-detail";
import { buildSavedCourseDirectionsShareData } from "../lib/saved-course-directions-share";
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
  shareCourse: () => Promise<void>;
  completeEdit: () => Promise<void>;
  canCompleteEdit: boolean;
}

/**
 * 저장 코스 상세 화면 orchestration 훅.
 * 공통 순서 변경 규칙과 공유/수정완료 CTA 정책을 묶어 saved widget 에 제공한다.
 */
export function useSavedCourseDetailScreen(
  course: SavedCourseDetailViewModel,
): UseSavedCourseDetailScreenValue {
  const [savedPlaces, setSavedPlaces] = useState<CoursePlaceItem[]>(() => [
    ...course.places,
  ]);
  const [places, setPlaces] = useState<CoursePlaceItem[]>(() => [...course.places]);
  const [saving, setSaving] = useState(false);
  const { toast, visible, show } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const points = toCoursePreviewPoints(places);
  const isEmpty = places.length === 0;
  const isReordered = !isSameCourseOrder(places, savedPlaces);

  const reorder = (from: number, to: number) => {
    setPlaces((prev) => reorderCoursePlaces(prev, from, to));
  };

  const resetOrder = () => {
    setPlaces([...savedPlaces]);
  };

  const shareCourse = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const shareData = buildSavedCourseDirectionsShareData(course.title, points);
    if (!shareData) {
      show("길안내를 공유할 장소가 부족해요.", "info");
      return;
    }

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        show("길안내 공유를 시작했어요.", "success");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        show("길안내 링크를 복사했어요.", "success");
        return;
      }

      show("공유를 지원하지 않는 브라우저예요.", "info");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      show("길안내를 공유하지 못했어요.", "info");
    }
  };

  const completeEdit = async () => {
    if (!isReordered || saving) {
      return;
    }

    setSaving(true);

    try {
      const request = buildSavedCourseUpdateRequest(course, places);
      await requestSavedCourseUpdate(course.id, request);
      setSavedPlaces([...places]);
      show("코스 수정을 완료했어요.", "success");
    } catch (error) {
      if (
        error instanceof SavedCourseUpdateRequestError &&
        error.status === 401
      ) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
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
    shareCourse,
    completeEdit,
    canCompleteEdit: isReordered && !saving,
  };
}
