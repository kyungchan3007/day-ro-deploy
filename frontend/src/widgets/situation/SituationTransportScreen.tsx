"use client";

import { AppShell, Button, Container, NavBar, StepProgress } from "@/shared/ui";
import { TransportCardGroup, useTransportStep } from "@/features/situation";
import type { TransportSelection } from "@/features/situation";

export interface SituationTransportScreenProps {
  /** 진행 표시용. 기본 3. */
  stepNumber?: number;
  /** 전체 스텝 수. 기본 4(시안). */
  totalSteps?: number;
  /** 이전 선택값(뒤로 왔을 때 복원). */
  value?: TransportSelection;
  /** 목적지(지역) 라벨. 문구에 사용. */
  destinationLabel?: string;
  /** CTA 버튼 문구. 기본 "다음". */
  nextLabel?: string;
  /** 상단 누적 요약 칩 바 슬롯. */
  summary?: React.ReactNode;
  onBack?: () => void;
  onNext?: (value: TransportSelection) => void;
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-block rounded-pill bg-primary-surface px-2.5 py-1 text-xs font-bold text-primary">
    {children}
  </span>
);

/**
 * 상황입력 · 이동수단 스텝 화면 (widgets/situation).
 * 두 구간(가는 길 / 도착 후)을 각각 이동수단 4종 중 하나로 선택한다.
 */
export function SituationTransportScreen({
  stepNumber = 3,
  totalSteps = 4,
  value,
  destinationLabel = "목적지",
  nextLabel = "다음",
  summary,
  onBack,
  onNext,
}: SituationTransportScreenProps) {
  const { go, setGo, local, setLocal, isValid } = useTransportStep(value);

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
            onClick={() => isValid && onNext?.({ go, local })}
          >
            {nextLabel}
          </Button>
        </div>
      }
      className="flex flex-col"
    >
      <StepProgress current={stepNumber} total={totalSteps} />

      <Container className="flex flex-1 flex-col pt-5">
        {summary}
        {/* ① 가는 길 */}
        <section>
          <Eyebrow>가는 길</Eyebrow>
          <p className="mt-2 text-sm text-text-muted">
            지금 위치에서 {destinationLabel}까지
          </p>
          <h2 className="mt-0.5 text-xl font-bold text-text-strong">
            어떻게 갈까요?
          </h2>
          <TransportCardGroup className="mt-3" value={go} onChange={setGo} />
        </section>

        {/* ② 도착 후 */}
        <section className="mt-6">
          <Eyebrow>도착 후</Eyebrow>
          <p className="mt-2 text-sm text-text-muted">{destinationLabel}에서는</p>
          <h2 className="mt-0.5 text-xl font-bold text-text-strong">
            어떻게 다닐까요?
          </h2>
          <TransportCardGroup
            className="mt-3"
            value={local}
            onChange={setLocal}
          />
        </section>
      </Container>
    </AppShell>
  );
}
