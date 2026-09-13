import { Fragment } from "react";

import { Toast } from "@/shared/ui/toast";

import { SITUATION_STEPS, type SituationStepKey } from "../model/flow";

export interface SituationStepGuideProps {
  className?: string;
}

/**
 * situation-step-guide : 코스 만들기 첫 진입 시 진행 순서를 알려주는 안내 토스트.
 *
 * 프레젠테이션 전용. 순서는 SITUATION_STEPS 단일 소스에서 파생하므로
 * 스텝 구성이 바뀌면 안내 문구도 자동으로 따라간다.
 * 노출 시점/1회 노출 여부 등 동작 로직은 컨트롤러(비즈니스 로직)가 담당한다.
 */
const STEP_GUIDE_LABELS: Record<SituationStepKey, string> = {
  time: "시간",
  region: "장소",
  purpose: "목적",
};

export function SituationStepGuide({ className }: SituationStepGuideProps) {
  return (
    <Toast
      variant="info"
      className={className}
      message={
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {SITUATION_STEPS.map((step, index) => (
            <Fragment key={step.key}>
              {index > 0 && (
                <span aria-hidden className="text-white/45">
                  →
                </span>
              )}
              <span className="font-semibold">
                {STEP_GUIDE_LABELS[step.key]}
              </span>
            </Fragment>
          ))}
          <span className="ml-0.5 text-white/70">순으로 추천해드려요</span>
        </span>
      }
    />
  );
}
