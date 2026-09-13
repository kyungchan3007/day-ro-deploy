"use client";

import type { ReactNode } from "react";

import {
  AppShell,
  Button,
  Container,
  Illustration,
  StepProgress,
} from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import { PurposeOptionGrid, usePurposeStep } from "@/features/situation";
import type { PurposeChoice } from "@/features/situation";
import styles from "./css/SituationPurposeScreen.module.css";

export interface SituationPurposeScreenProps {
  /** 진행 표시용. 기본 4. */
  stepNumber?: number;
  /** 전체 스텝 수. 기본 4(시안). */
  totalSteps?: number;
  /** 이전 선택값(뒤로 왔을 때 복원). */
  value?: PurposeChoice;
  /** CTA 버튼 문구. 기본 "추천받기!". */
  nextLabel?: string;
  /** 상단 누적 요약 칩 바 슬롯. */
  summary?: ReactNode;
  onBack?: () => void;
  onNext?: (value: PurposeChoice) => void;
}

/**
 * 상황입력 · 목적 스텝 화면 (widgets/situation).
 * intro 일러스트 스팟 + 목적 4종 카드 + '추천받기!' CTA.
 */
export function SituationPurposeScreen({
  stepNumber = 4,
  totalSteps = 4,
  value,
  nextLabel = "추천받기!",
  summary,
  onBack,
  onNext,
}: SituationPurposeScreenProps) {
  const { selected, setSelected, isValid } = usePurposeStep(value);

  return (
    <AppShell
      bleed
      nav={<AccountNavBar onBack={onBack} />}
      footer={
        <div className={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid}
            onClick={() => selected && onNext?.(selected)}
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
        <Illustration name="intro" width={150} priority />

        <h1 className={`${styles.heading} text-2xl font-bold leading-snug text-text-strong`}>
          오늘은 어떤 자리예요?
        </h1>

        <PurposeOptionGrid
          className={styles.grid}
          value={selected}
          onChange={setSelected}
        />
      </Container>
    </AppShell>
  );
}
