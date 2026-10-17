"use client";

import type {
  PopularRegionKeyword,
  RegionGroup,
  SituationFlowStep,
} from "@/features/situation";
import {
  SituationStepGuide,
  SituationSummary,
} from "@/features/situation";
import { renderToast, ToastViewport } from "@/shared/ui/toast";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { SituationTimeScreen } from "./SituationTimeScreen";
import { useSituationFlowController } from "./hooks";
import styles from "./css/SituationFlow.module.css";

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

/**
 * 상황입력 위저드 셸 (widgets/situation).
 */
export interface SituationFlowProps {
  step: SituationFlowStep;
  /** 화면 상태 스냅샷 키(issue #129). 조건·후보는 클라이언트 흐름 상태에서 복원한다. */
  rev?: string;
  regionGroups: RegionGroup[];
  popularRegionKeywords: PopularRegionKeyword[];
}

export function SituationFlow({
  step,
  rev,
  regionGroups,
  popularRegionKeywords,
}: SituationFlowProps) {
  const flow = useSituationFlowController({ step, rev });

  // 흐름 상태 복원 전(서버 렌더·hydration)에는 화면 높이만 확보한 빈 셸을 둔다.
  // 결과·지도 화면은 복원된 데이터로 처음 마운트되어야 초기 state 가 비지 않는다.
  if (flow.kind === "restoring") {
    return <div className="min-h-dvh" aria-busy="true" />;
  }

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
        retryExhausted={flow.retryExhausted}
        toastVisible={flow.toastVisible}
        toastMessage={flow.toastMessage}
        toastVariant={flow.toastVariant}
        onBack={flow.handleBack}
        onBeforeLogin={flow.handleBeforeLogin}
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
        onBeforeLogin={flow.handleBeforeLogin}
      />
    );
  }

  // 토스트는 헤더 아래 상단 공용 위치(ToastViewport)에 띄운다(issue #194).
  const stepToast = renderToast({
    visible: flow.toastVisible,
    message: flow.toastMessage,
    variant: flow.toastVariant,
  });

  // 요약 칩 바 · 토스트 영역은 스텝 공통으로 한 번만 만들고, 화면만 스텝별로 고른다(issue #229).
  const summary = (
    <SituationSummary
      answers={flow.answers}
      currentStep={flow.currentStep}
      onEdit={flow.editStep}
      className={styles.summary}
    />
  );

  let screen: ReactNode;
  switch (flow.currentStep) {
    case "purpose":
      screen = (
        <SituationPurposeScreen
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.purpose}
          nextLabel={flow.nextLabel}
          summary={summary}
          onBack={flow.handleBack}
          onBeforeLogin={flow.handleBeforeLogin}
          onNext={flow.setPurpose}
        />
      );
      break;
    case "region":
      screen = (
        <SituationRegionScreen
          groups={regionGroups}
          popularKeywords={popularRegionKeywords}
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.region}
          nextLabel={flow.nextLabel}
          summary={summary}
          onBack={flow.handleBack}
          onBeforeLogin={flow.handleBeforeLogin}
          onNext={flow.setRegion}
        />
      );
      break;
    case "time":
    default:
      screen = (
        <SituationTimeScreen
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.time}
          placeCount={flow.answers.placeCount}
          nextLabel={flow.nextLabel}
          summary={summary}
          onBack={flow.handleBack}
          onBeforeLogin={flow.handleBeforeLogin}
          onNext={flow.setTime}
        />
      );
  }

  return (
    <>
      {screen}
      <ToastViewport>
        {/* Fragment 로 감싸면 비어 있어도 자식 1개로 세어져 빈 토스트 영역이 남는다 → 직접 자식으로 둔다. */}
        {/* 첫 진입 안내는 시간 스텝(그 밖 기본값 포함)에서만 함께 둔다(가시성 판단은 컨트롤러). */}
        {flow.currentStep !== "purpose" && flow.currentStep !== "region" && flow.stepGuideVisible ? (
          <SituationStepGuide />
        ) : null}
        {stepToast}
      </ToastViewport>
    </>
  );
}
