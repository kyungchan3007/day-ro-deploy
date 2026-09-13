"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useToast, type ToastVariant } from "@/shared/ui/toast";
import {
  isSameCourseOrder,
  reorderCoursePlaces,
  toCoursePreviewPoints,
  type CoursePoint,
} from "@/shared/lib/course-preview";
import type { CourseSaveDraft } from "../model/save-course";
import type { PlaceCandidate, SituationAnswers } from "@/features/situation";
import { CourseSaveRequestError, requestCourseSave } from "../api/save-course";
import { buildCourseSaveRequest } from "../model/save-course";
import { buildNaverRouteDeepLink } from "../lib/route-deeplink";

export interface UseCourseMapScreenValue {
  places: PlaceCandidate[];
  isEmpty: boolean;
  points: CoursePoint[];
  /** 원래(AI 추천) 순서에서 바뀐 상태인지 — 리셋 버튼 노출 판단. */
  isReordered: boolean;
  /** 드래그앤드롭 재정렬: from → to 로 이동. */
  reorder: (from: number, to: number) => void;
  /** 원래(AI 추천) 순서로 되돌리기. */
  resetOrder: () => void;
  sheetOpen: boolean;
  toastVisible: boolean;
  toastMessage: string | null;
  toastVariant: ToastVariant | null;
  openSaveSheet: () => void;
  closeSaveSheet: () => void;
  submitSaveSheet: (input: CourseSaveDraft) => Promise<void>;
  startRouteGuide: () => void;
}

/**
 * 확정 코스 화면 orchestration 훅 (features/course-map).
 *
 * 서버가 URL에서 복원해 내려준 확정 순서(initialPlaces = 원래 순서)를 기준으로,
 * 사용자가 지도를 보며 드래그로 순서를 바꿀 수 있게 한다. 재정렬 순서는 이 화면의
 * 클라이언트 state 로만 유지하고, "원래 순서로 되돌리기"로 initialPlaces 로 리셋한다.
 * 지도 포인트는 현재 순서에서 파생되므로 재정렬 시 마커 번호·경로선이 자동 갱신된다.
 *
 * @param initialPlaces URL에서 복원된 원래(AI 추천) 순서. 리셋 기준이자 코스 식별 기준.
 * @returns 확정 코스 화면이 소비할 상태와 액션 묶음.
 */
export function useCourseMapScreen(
  initialPlaces: readonly PlaceCandidate[],
  answers: SituationAnswers,
): UseCourseMapScreenValue {
  const [orderedPlaces, setOrderedPlaces] = useState<PlaceCandidate[]>(() => [
    ...initialPlaces,
  ]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast, visible, show } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const points = toCoursePreviewPoints(orderedPlaces);
  const isEmpty = orderedPlaces.length === 0;
  const isReordered = !isSameCourseOrder(orderedPlaces, initialPlaces);

  const reorder = (from: number, to: number) => {
    setOrderedPlaces((prev) => reorderCoursePlaces(prev, from, to));
  };

  const resetOrder = () => {
    setOrderedPlaces([...initialPlaces]);
  };

  const openSaveSheet = () => setSheetOpen(true);
  const closeSaveSheet = () => setSheetOpen(false);

  /**
   * 코스 저장 제출.
   * 현재 정렬 순서와 상황입력 answers 를 저장 계약으로 조합해 BFF에 전달한다.
   */
  const submitSaveSheet = async (input: CourseSaveDraft) => {
    try {
      const request = buildCourseSaveRequest({
        draft: input,
        answers,
        places: orderedPlaces,
      });
      await requestCourseSave(request);
      setSheetOpen(false);
      show("코스가 저장되었습니다.", "success");
    } catch (error) {
      if (error instanceof CourseSaveRequestError && error.status === 401) {
        const currentRoute = `${pathname}${
          searchParams.size > 0 ? `?${searchParams.toString()}` : ""
        }`;
        router.push(`/login?next=${encodeURIComponent(currentRoute)}`);
      }

      throw error instanceof Error
        ? error
        : new Error("코스 저장에 실패했습니다.");
    }
  };

  /**
   * 경로 안내 시작.
   * 현재 정렬 순서의 좌표 있는 장소로 네이버지도 웹 길찾기 URL을 만들어 **새 탭**으로 연다.
   * 현재 코스 화면(이 서비스)은 그대로 유지되고, 네이버지도는 별도 탭에서 열린다.
   * 좌표 유효 장소가 2곳 미만이면 길안내 대신 안내 토스트를 노출한다.
   *
   * 새 탭은 클릭 제스처 안에서 동기적으로 열어야 팝업 차단을 피할 수 있어, 앱 스킴(nmap://)을
   * 먼저 시도한 뒤 지연 폴백하는 방식은 쓰지 않는다. 모바일에서는 새 탭에 뜬 네이버 웹이
   * 자체적으로 "앱으로 열기"를 안내해 네이티브 앱으로 이어진다.
   */
  const startRouteGuide = () => {
    const deepLink = buildNaverRouteDeepLink(points);
    if (!deepLink) {
      show("길 안내를 시작할 장소가 부족해요.", "info");
      return;
    }

    window.open(deepLink.webFallbackUrl, "_blank", "noopener,noreferrer");
  };

  return {
    places: orderedPlaces,
    isEmpty,
    points,
    isReordered,
    reorder,
    resetOrder,
    sheetOpen,
    toastVisible: visible,
    toastMessage: toast?.message ?? null,
    toastVariant: toast?.variant ?? null,
    openSaveSheet,
    closeSaveSheet,
    submitSaveSheet,
    startRouteGuide,
  };
}
