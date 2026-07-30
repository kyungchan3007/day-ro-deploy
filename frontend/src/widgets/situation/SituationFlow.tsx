"use client";

import type { RegionGroup } from "@/features/situation";
import { SituationTimeScreen } from "./SituationTimeScreen";
import { SituationRegionScreen } from "./SituationRegionScreen";
import { SituationPurposeScreen } from "./SituationPurposeScreen";
import { SituationLoadingScreen } from "./SituationLoadingScreen";
import { SituationResultScreen } from "./SituationResultScreen";
import { SituationSummary } from "@/features/situation";
import { useSituationFlowController } from "./hooks";

/**
 * 상황입력 위저드 셸 (widgets/situation).
 */
export interface SituationFlowProps {
  initialRegionGroups?: RegionGroup[];
}

export function SituationFlow({
  initialRegionGroups,
}: SituationFlowProps) {
  const flow = useSituationFlowController();

  if (flow.kind === "loading") {
    return <SituationLoadingScreen answers={flow.answers} />;
  }

  if (flow.kind === "result") {
    return (
      <SituationResultScreen answers={flow.answers} onBack={flow.handleBack} />
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
              className="mb-5"
            />
          }
          onBack={flow.handleBack}
          onNext={flow.setPurpose}
        />
      );
    case "region":
      return (
        <SituationRegionScreen
          groups={initialRegionGroups ?? []}
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.region}
          nextLabel={flow.nextLabel}
          summary={
            <SituationSummary
              answers={flow.answers}
              currentStep="region"
              onEdit={flow.editStep}
              className="mb-5"
            />
          }
          onBack={flow.handleBack}
          onNext={flow.setRegion}
        />
      );
    case "time":
    default:
      return (
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
              className="mb-5"
            />
          }
          onBack={flow.handleBack}
          onNext={flow.setTime}
        />
      );
  }
}
