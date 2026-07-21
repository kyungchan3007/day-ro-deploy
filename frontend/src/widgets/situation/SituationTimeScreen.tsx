"use client";

import type { ReactNode } from "react";

import {
  AppShell,
  Button,
  ClockIcon,
  Container,
  NavBar,
  StepProgress,
} from "@/shared/ui";
import {
  TimeRangeField,
  TimeWheel,
  useTimeRangeStep,
} from "@/features/situation";
import type { TimeRange } from "@/features/situation";

/** 시안 초기 상태(오전 6:55 ~ 오전 12:55). */
const DEFAULT_RANGE: TimeRange = {
  start: { meridiem: "오전", hour: 6, minute: 55 },
  end: { meridiem: "오전", hour: 12, minute: 55 },
};

export interface SituationTimeScreenProps {
  /** 진행 표시용. 기본 1. */
  stepNumber?: number;
  /** 전체 스텝 수. 기본 4(시안). */
  totalSteps?: number;
  /** 이전에 입력한 값(뒤로 왔을 때 복원). */
  value?: TimeRange;
  /** 다음(CTA) 버튼 문구. 다음 스텝을 예고한다. 기본 "다음". */
  nextLabel?: string;
  /** 상단 누적 요약 칩 바 슬롯. */
  summary?: ReactNode;
  onBack?: () => void;
  onNext?: (range: TimeRange) => void;
}

/**
 * 상황입력 · 시간 스텝 화면 (widgets/situation).
 * AppShell(640 규격) + NavBar + StepProgress + 시간 범위 필드 + 휠 피커 + 다음 CTA.
 */
export function SituationTimeScreen({
  stepNumber = 1,
  totalSteps = 4,
  value,
  nextLabel = "다음",
  summary,
  onBack,
  onNext,
}: SituationTimeScreenProps) {
  const {
    range,
    activeField,
    setActiveField,
    setActiveTime,
    isValid,
    overnight,
    durationLabel,
    exceedsLimit,
    maxDurationLabel,
  } = useTimeRangeStep(value ?? DEFAULT_RANGE);

  return (
    <AppShell
      bleed
      nav={<NavBar onBack={onBack} />}
      footer={
        <div className="border-t border-border px-4 py-3 sm:px-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid}
            onClick={() => onNext?.(range)}
          >
            {nextLabel}
          </Button>
        </div>
      }
      className="flex flex-col"
    >
      <StepProgress current={stepNumber} total={totalSteps} />

      <Container className="flex flex-1 flex-col pt-6">
        {summary}
        <h1 className="text-center text-2xl font-bold leading-snug text-text-strong">
          이번 데이트 시간은
          <br />
          어떻게 되나요?
        </h1>

        <TimeRangeField
          className="mt-8"
          range={range}
          activeField={activeField}
          onSelectField={setActiveField}
          overnight={overnight}
        />

        {/*
          카피 톤 후보 (택1로 교체). D = durationLabel(굵게):
          1) 담백 (기본):   {D} 동안 함께해요 [· 다음날까지]
          2) 강조/귀여움:   무려 {D} 함께해요 / {D}이나 함께해요
          3) 감성:          온전히 {D}, 함께해요
        */}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-text-muted">
          <span className="text-primary">
            <ClockIcon size={15} />
          </span>
          <span>
            <span className="font-bold text-text-strong">{durationLabel}</span> 동안 함께해요
            {overnight && <span className="text-primary"> · 다음날까지</span>}
          </span>
        </p>
        <p className="mt-2 text-center text-sm text-text-muted">
          {exceedsLimit
            ? `만나는 시작 시간 기준 ${maxDurationLabel} 이내로 선택해 주세요.`
            : `만나는 시작 시간 기준 최대 ${maxDurationLabel}까지 선택할 수 있어요.`}
        </p>

        <TimeWheel
          className="mt-6"
          value={range[activeField]}
          onChange={setActiveTime}
        />
      </Container>
    </AppShell>
  );
}
