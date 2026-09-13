"use client";

import type {
  PlaceCandidate,
  PopularRegionKeyword,
  RegionGroup,
  SituationAnswers,
  SituationFlowStep,
} from "@/features/situation";
import dynamic from "next/dynamic";
import { SituationTimeScreen } from "./SituationTimeScreen";

// 초기 스텝(시간)만 static 로 즉시 렌더하고, 비초기 화면은 스텝 진행 시에만 필요하므로
// next/dynamic 으로 지연 로드해 /course/new 초기 클라이언트 번들에서 분리한다.
// (특히 지도 화면은 @dnd-kit·카카오맵 의존성을 끌고 온다.) ssr 기본값 유지 → 직접 진입 시 SSR 보존.
const SituationRegionScreen = dynamic(() =>
  import("./SituationRegionScreen").then((m) => m.SituationRegionScreen),
);
const SituationPurposeScreen = dynamic(() =>
  import("./SituationPurposeScreen").then((m) => m.SituationPurposeScreen),
);
const SituationLoadingScreen = dynamic(() =>
  import("./SituationLoadingScreen").then((m) => m.SituationLoadingScreen),
);
const CourseResultScreen = dynamic(() =>
  import("../course-result/CourseResultScreen").then(
    (m) => m.CourseResultScreen,
  ),
);
const CourseMapScreen = dynamic(() =>
  import("../course-map/CourseMapScreen").then((m) => m.CourseMapScreen),
);
import {
  SituationStepGuide,
  SituationSummary,
} from "@/features/situation";
import { useSituationFlowController } from "./hooks";
import styles from "./css/SituationFlow.module.css";

/**
 * 상황입력 위저드 셸 (widgets/situation).
 */
export interface SituationFlowProps {
  step: SituationFlowStep;
  answers: SituationAnswers;
  regionGroups: RegionGroup[];
  popularRegionKeywords: PopularRegionKeyword[];
  candidates: PlaceCandidate[];
  selectedPlaces: PlaceCandidate[];
  candidateRequestId?: string;
  remainingRetries?: number;
}

export function SituationFlow({
  step,
  answers,
  regionGroups,
  popularRegionKeywords,
  candidates,
  selectedPlaces,
  candidateRequestId,
  remainingRetries,
}: SituationFlowProps) {
  const flow = useSituationFlowController({
    step,
    answers,
    candidates,
    selectedPlaces,
    candidateRequestId,
    remainingRetries,
  });

  if (flow.kind === "loading") {
    return (
      <SituationLoadingScreen
        answers={flow.answers}
        ready={flow.ready}
        onViewCourse={flow.onViewCourse}
        quiz={flow.quiz}
      />
    );
  }

  if (flow.kind === "result") {
    return (
      <CourseResultScreen
        candidates={flow.candidates}
        remainingRetries={flow.remainingRetries}
        toastVisible={flow.toastVisible}
        toastMessage={flow.toastMessage}
        toastVariant={flow.toastVariant}
        onBack={flow.handleBack}
        onReroll={flow.handleReroll}
        onComplete={flow.handleComplete}
      />
    );
  }

  if (flow.kind === "course") {
    return (
      <CourseMapScreen
        places={flow.selectedPlaces}
        answers={flow.answers}
        onBack={flow.handleBack}
      />
    );
  }

  switch (flow.currentStep) {
    case "purpose":
      return (
        <SituationPurposeScreen
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.purpose}
          nextLabel={flow.nextLabel}
          summary={
            <SituationSummary
              answers={flow.answers}
              currentStep="purpose"
              onEdit={flow.editStep}
              className={styles.summary}
            />
          }
          onBack={flow.handleBack}
          onNext={flow.setPurpose}
        />
      );
    case "region":
      return (
        <SituationRegionScreen
          groups={regionGroups}
          popularKeywords={popularRegionKeywords}
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.region}
          nextLabel={flow.nextLabel}
          summary={
            <SituationSummary
              answers={flow.answers}
              currentStep="region"
              onEdit={flow.editStep}
              className={styles.summary}
            />
          }
          onBack={flow.handleBack}
          onNext={flow.setRegion}
        />
      );
    case "time":
    default:
      return (
        <>
          <SituationTimeScreen
            stepNumber={flow.stepNumber}
            totalSteps={flow.totalSteps}
            value={flow.answers.time}
            nextLabel={flow.nextLabel}
            summary={
              <SituationSummary
                answers={flow.answers}
                currentStep="time"
                onEdit={flow.editStep}
                className={styles.summary}
              />
            }
            onBack={flow.handleBack}
            onNext={flow.setTime}
          />
          {flow.stepGuideVisible ? (
            <SituationStepGuide className={styles.stepGuide} />
          ) : null}
        </>
      );
  }
}
