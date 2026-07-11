"use client";

import type { ReactNode } from "react";

import {
  AppShell,
  Button,
  Container,
  Illustration,
  NavBar,
  StepProgress,
} from "@/shared/ui";
import {
  REGION_GROUPS,
  RegionAreaChips,
  RegionGroupChips,
  useRegionStep,
} from "@/features/situation";

export interface SituationRegionScreenProps {
  /** 진행 표시용. 기본 2. */
  stepNumber?: number;
  /** 전체 스텝 수. 기본 4(시안). */
  totalSteps?: number;
  /** 이전에 선택한 지역 id(뒤로 왔을 때 복원). */
  value?: string;
  /** CTA 버튼 문구. 기본 "다음". */
  nextLabel?: string;
  /** 상단 누적 요약 칩 바 슬롯. */
  summary?: ReactNode;
  onBack?: () => void;
  onNext?: (regionId: string) => void;
}

/**
 * 상황입력 · 지역 스텝 화면 (widgets/situation).
 * date-planning 일러스트 스팟 + 지역 아코디언 + 다음 CTA.
 */
export function SituationRegionScreen({
  stepNumber = 2,
  totalSteps = 4,
  value,
  nextLabel = "다음",
  summary,
  onBack,
  onNext,
}: SituationRegionScreenProps) {
  const {
    selected,
    setSelected,
    activeGroup,
    setActiveGroup,
    activeAreas,
    isValid,
  } = useRegionStep(value);

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
            onClick={() => selected && onNext?.(selected)}
          >
            {nextLabel}
          </Button>
        </div>
      }
      className="flex flex-col"
    >
      <StepProgress current={stepNumber} total={totalSteps} />

      <Container className="flex min-h-0 flex-1 flex-col items-center pt-5">
        {summary}
        {/* 고정 영역: 일러스트 + 질문 + 그룹 칩 */}
        <Illustration name="date-planning" width={110} priority />
        <h1 className="mt-3 text-center text-2xl font-bold leading-snug text-text-strong">
          이번 데이트는
          <br />
          어디로 갈까요?
        </h1>
        <RegionGroupChips
          className="mt-6 w-full"
          groups={REGION_GROUPS}
          activeGroup={activeGroup}
          selected={selected}
          onSelectGroup={setActiveGroup}
        />

        {/* 스크롤 영역: 선택 그룹의 세부 지역 칩만 스크롤(버튼·질문·그룹은 고정) */}
        <div className="mt-4 min-h-0 w-full flex-1 overflow-y-auto pb-2">
          <RegionAreaChips
            areas={activeAreas}
            selected={selected}
            onSelectArea={(id) => setSelected(id)}
          />
        </div>
      </Container>
    </AppShell>
  );
}
