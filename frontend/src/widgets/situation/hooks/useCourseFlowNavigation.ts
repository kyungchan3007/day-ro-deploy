"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  buildCourseRouteUrl,
  recordCourseFlowSnapshot,
  type CourseFlowSnapshotInput,
  type SituationAnswers,
  type SituationFlowStep,
} from "@/features/situation";

/**
 * 상황입력 흐름의 화면 이동 훅 (widgets/situation).
 *
 * 다음 화면의 불변 스냅샷을 흐름 상태에 기록하고 `?step=&rev=` 주소를 만든다(issue #129).
 * 현재 rev 는 정리 대상에서 보호해 뒤로가기로 돌아올 수 있게 한다.
 *
 * @param rev 현재 화면의 스냅샷 키.
 * @param answers 현재 화면의 조건(goStep 기본값).
 */
export function useCourseFlowNavigation({
  rev,
  answers,
}: {
  rev?: string;
  answers: SituationAnswers;
}) {
  const router = useRouter();

  /** 다음 화면 스냅샷을 기록하고 이동할 주소를 돌려준다(이동은 호출부가 push/replace 선택). */
  const recordStepUrl = useCallback(
    (input: CourseFlowSnapshotInput) => {
      const nextRev = recordCourseFlowSnapshot(input, rev ? [rev] : []);
      return buildCourseRouteUrl({ step: input.step, rev: nextRev });
    },
    [rev],
  );

  /** 다음 화면 스냅샷을 기록하고 히스토리에 추가(push)한다. 후보·선택은 기본 비움. */
  const goStep = useCallback(
    (
      nextStep: SituationFlowStep,
      nextAnswers: SituationAnswers = answers,
      extra: Partial<Omit<CourseFlowSnapshotInput, "step" | "answers">> = {},
    ) => {
      router.push(
        recordStepUrl({
          step: nextStep,
          answers: nextAnswers,
          candidates: [],
          selectedPlaces: [],
          ...extra,
        }),
      );
    },
    [answers, recordStepUrl, router],
  );

  return { router, recordStepUrl, goStep };
}
