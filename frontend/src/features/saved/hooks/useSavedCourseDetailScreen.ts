"use client";

import { trackEvent } from "@/shared/analytics";

import { useToast } from "@/shared/ui";
import type { ToastVariant } from "@/shared/ui";
import type { CoursePlaceItem, CoursePoint } from "@/shared/lib/course-preview";
import { buildLoginRedirectPath } from "@/shared/lib/login-redirect";
import { useCoursePreviewOrder } from "@/shared/lib/useCoursePreviewOrder";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { SavedCourseDetailViewModel } from "../model/saved-course-detail";
import { buildSavedCourseDirectionsShareData } from "../lib/saved-course-directions-share";
import { SHARE_MESSAGES, canUseSystemShare, classifyShareError } from "../lib/share-result";
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
 * 공유는 방법 시트(링크 복사 · 다른 앱으로 공유)를 거치고, 취소를 뺀 모든 결과를 토스트로 알린다(issue #183).
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
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [canSystemShare, setCanSystemShare] = useState(false);
  const closeShareSheet = () => setShareSheetOpen(false);

  /** 공유 데이터. 공유 url 은 데이로 공유 페이지(미리보기 = 데이로 카드, issue #187). */
  const buildShareData = () =>
    buildSavedCourseDirectionsShareData(points, {
      origin: window.location.origin,
      sharerName,
    });

  const shareCourse = async () => {
    if (typeof window === "undefined") {
      return;
    }
    if (!buildShareData()) {
      show(SHARE_MESSAGES.noPlaces, "info");
      return;
    }
    setCanSystemShare(canUseSystemShare(navigator));
    setShareSheetOpen(true);
  };

  /** 링크를 복사한다. 성공 여부를 돌려줘 시스템 공유 실패 폴백에서도 쓴다. */
  const writeShareLink = async (url: string): Promise<boolean> => {
    try {
      if (!navigator.clipboard?.writeText) {
        return false;
      }
      await navigator.clipboard.writeText(url);
      trackEvent("course_shared", { method: "clipboard" });
      return true;
    } catch {
      return false;
    }
  };

  const copyShareLink = async () => {
    setShareSheetOpen(false);
    const shareData = buildShareData();
    if (!shareData) {
      show(SHARE_MESSAGES.noPlaces, "info");
      return;
    }
    const copied = await writeShareLink(shareData.url);
    show(copied ? SHARE_MESSAGES.copied : SHARE_MESSAGES.copyFailed, copied ? "success" : "info");
  };

  const shareViaSystem = async () => {
    setShareSheetOpen(false);
    const shareData = buildShareData();
    if (!shareData) {
      show(SHARE_MESSAGES.noPlaces, "info");
      return;
    }
    try {
      if (!canUseSystemShare(navigator)) {
        throw new Error("share_unsupported");
      }
      await navigator.share(shareData);
      trackEvent("course_shared", { method: "share_sheet" });
      show(SHARE_MESSAGES.shared, "success");
    } catch (error) {
      // 사용자가 공유 창을 직접 닫은 경우만 조용히 끝낸다.
      if (classifyShareError(error) === "cancelled") {
        return;
      }
      const copied = await writeShareLink(shareData.url);
      show(
        copied ? SHARE_MESSAGES.sharedFallbackCopied : SHARE_MESSAGES.copyFailed,
        copied ? "success" : "info",
      );
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
    shareCourse,
    shareSheetOpen,
    canSystemShare,
    closeShareSheet,
    copyShareLink,
    shareViaSystem,
    completeEdit,
    canCompleteEdit: isReordered && !saving,
  };
}
