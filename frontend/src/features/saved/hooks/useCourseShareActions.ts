"use client";

import { useState } from "react";

import { trackEvent } from "@/shared/analytics";
import type { ToastVariant } from "@/shared/ui";
import type { CoursePoint } from "@/shared/lib/course-preview";
import { buildSavedCourseDirectionsShareData } from "../lib/saved-course-directions-share";
import { SHARE_MESSAGES, canUseSystemShare, classifyShareError } from "../lib/share-result";

export interface UseCourseShareActionsValue {
  /** "길안내 공유": 공유 방법 시트를 연다(장소가 부족하면 안내). */
  shareCourse: () => Promise<void>;
  shareSheetOpen: boolean;
  canSystemShare: boolean;
  closeShareSheet: () => void;
  /** 시트 "링크 복사". */
  copyShareLink: () => Promise<void>;
  /** 시트 "다른 앱으로 공유". 실패하면 링크 복사로 대신한다. */
  shareViaSystem: () => Promise<void>;
}

/**
 * 저장 코스 길안내 공유 동작 (issue #183 · #187 · #192 분리).
 *
 * 공유 방법 시트 열림 · 링크 복사 · 시스템 공유 · 실패 시 링크 복사 대체를 소유하고,
 * 취소를 뺀 모든 결과를 토스트로 알린다. 공유 url 은 데이로 공유 페이지(미리보기 = 데이로 카드).
 * @param points 현재 순서의 코스 지점.
 * @param sharerName 공유 미리보기 설명에 넣을 닉네임.
 * @param show 토스트 표시.
 */
export function useCourseShareActions(params: {
  points: readonly CoursePoint[];
  sharerName: string | null;
  show: (message: string, variant?: ToastVariant) => void;
}): UseCourseShareActionsValue {
  const { points, sharerName, show } = params;
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [canSystemShare, setCanSystemShare] = useState(false);
  const closeShareSheet = () => setShareSheetOpen(false);

  /** 공유 데이터를 만든다. 장소가 부족하면 안내 토스트를 띄우고 null 을 돌려준다(issue #229 중복 정리). */
  const prepareShareData = () => {
    const shareData = buildSavedCourseDirectionsShareData(points, {
      origin: window.location.origin,
      sharerName,
    });
    if (!shareData) {
      show(SHARE_MESSAGES.noPlaces, "info");
    }
    return shareData;
  };

  const shareCourse = async () => {
    if (!prepareShareData()) {
      return;
    }
    setCanSystemShare(canUseSystemShare(navigator));
    setShareSheetOpen(true);
  };

  /** 링크를 복사한다. 성공 여부를 돌려줘 시스템 공유 실패 대체에서도 쓴다. */
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
    const shareData = prepareShareData();
    if (!shareData) {
      return;
    }
    const copied = await writeShareLink(shareData.url);
    show(copied ? SHARE_MESSAGES.copied : SHARE_MESSAGES.copyFailed, copied ? "success" : "info");
  };

  const shareViaSystem = async () => {
    setShareSheetOpen(false);
    const shareData = prepareShareData();
    if (!shareData) {
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

  return {
    shareCourse,
    shareSheetOpen,
    canSystemShare,
    closeShareSheet,
    copyShareLink,
    shareViaSystem,
  };
}
