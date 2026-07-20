"use client";

import { SituationTimeScreen } from "./SituationTimeScreen";
import { SituationRegionScreen } from "./SituationRegionScreen";
import { SituationTransportScreen } from "./SituationTransportScreen";
import { SituationLoadingScreen } from "./SituationLoadingScreen";
import { SituationSummary } from "@/features/situation";
import { useSituationFlowController } from "./hooks";

/**
 * 상황입력 위저드 셸 (widgets/situation).
 */
export function SituationFlow() {
  const flow = useSituationFlowController();

  if (flow.kind === "loading") {
    return <SituationLoadingScreen answers={flow.answers} />;
  }

  switch (flow.currentStep) {
    case "transport":
      return (
        <SituationTransportScreen
          stepNumber={flow.stepNumber}
          totalSteps={flow.totalSteps}
          value={flow.answers.transport}
          destinationLabel={flow.destinationLabel}
          nextLabel={flow.nextLabel}
          summary={
            <SituationSummary
              answers={flow.answers}
              currentStep="transport"
              onEdit={flow.editStep}
              className="mb-5"
            />
          }
          onBack={flow.handleBack}
          onNext={flow.setTransport}
        />
      );
    case "region":
      return (
        <SituationRegionScreen
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
