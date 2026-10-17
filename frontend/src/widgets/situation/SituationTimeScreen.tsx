"use client";

import type { ReactNode } from "react";

import {
  AppShell,
  Button,
  ClockIcon,
  Container,
  StepProgress,
} from "@/shared/ui";
import { situationStatic } from "@/shared/static/situation";
import { AccountNavBar } from "@/features/auth";
import {
  PlaceCountStepper,
  TimeRangeField,
  TimeWheel,
  usePlaceCountStep,
  useTimeRangeStep,
} from "@/features/situation";
import type { TimeRange } from "@/features/situation";
import styles from "./css/SituationTimeScreen.module.css";

/** 시안 초기 상태(오전 6:55 ~ 오후 12:55). */
const DEFAULT_RANGE: TimeRange = {
  start: { meridiem: "오전", hour: 6, minute: 55 },
  end: { meridiem: "오후", hour: 12, minute: 55 },
};
const durationMetaCopy = situationStatic.time.durationMeta;

export interface SituationTimeScreenProps {
  /** 메뉴 로그인 직전 호출(흐름 스냅샷 인계, issue #181). */
  onBeforeLogin?: () => void;
  /** 진행 표시용. 기본 1. */
  stepNumber?: number;
  /** 전체 스텝 수. 기본 4(시안). */
  totalSteps?: number;
  /** 이전에 입력한 값(뒤로 왔을 때 복원). */
  value?: TimeRange;
  /** 이전에 고른 장소 수(뒤로 왔을 때 복원, issue #247). 없으면 기본 3곳. */
  placeCount?: number;
  /** 다음(CTA) 버튼 문구. 다음 스텝을 예고한다. 기본 "다음". */
  nextLabel?: string;
  /** 상단 누적 요약 칩 바 슬롯. */
  summary?: ReactNode;
  onBack?: () => void;
  onNext?: (range: TimeRange, placeCount: number) => void;
}

/**
 * 상황입력 · 시간 스텝 화면 (widgets/situation).
 * AppShell(640 규격) + NavBar + StepProgress + 시간 범위 필드 + 휠 피커 + 장소 수 스테퍼(issue #247) + 다음 CTA.
 */
export function SituationTimeScreen({
  stepNumber = 1,
  totalSteps = 4,
  value,
  placeCount: initialPlaceCount,
  nextLabel = "다음",
  summary,
  onBack,
  onBeforeLogin,
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
    belowMinLimit,
    minDurationLabel,
    maxDurationLabel,
  } = useTimeRangeStep(value ?? DEFAULT_RANGE);
  const places = usePlaceCountStep(initialPlaceCount);

  return (
    <AppShell
      bleed
      nav={<AccountNavBar onBack={onBack} onBeforeLogin={onBeforeLogin} />}
      footer={
        <div className={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid}
            onClick={() => onNext?.(range, places.count)}
          >
            {nextLabel}
          </Button>
        </div>
      }
      className={styles.screen}
    >
      <StepProgress current={stepNumber} total={totalSteps} />

      <Container className={styles.content}>
        {summary}
        <h1 className="text-center text-display font-bold leading-snug text-text-strong">
          이번 데이트 시간은
          <br />
          어떻게 되나요?
        </h1>

        <TimeRangeField
          className={styles.field}
          range={range}
          activeField={activeField}
          onSelectField={setActiveField}
          overnight={overnight}
        />

        <p className={`${styles.duration} text-control leading-5 text-text-muted`}>
          <span className="text-primary">
            <ClockIcon size={15} />
          </span>
          <span>
            <span className="font-bold text-text-strong">{durationLabel}</span> 동안 함께해요
            {overnight && <span className="text-primary"> · 다음날까지</span>}
          </span>
        </p>
        <p className={`${styles.durationMeta} text-control leading-5 text-text-muted`}>
          {/* 범위 안내 문구는 shared/static 에서 바인딩한다(issue #229). */}
          {belowMinLimit
            ? durationMetaCopy.belowMin(minDurationLabel)
            : exceedsLimit
              ? durationMetaCopy.exceedsMax(maxDurationLabel)
              : durationMetaCopy.range(minDurationLabel, maxDurationLabel)}
        </p>

        <TimeWheel
          className={styles.wheel}
          value={range[activeField]}
          onChange={setActiveTime}
        />

        <PlaceCountStepper
          className={styles.placeCount}
          count={places.count}
          canDecrease={places.canDecrease}
          canIncrease={places.canIncrease}
          onDecrease={places.decrease}
          onIncrease={places.increase}
        />
      </Container>
    </AppShell>
  );
}
