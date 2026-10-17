"use client";

import type { ReactNode } from "react";

import {
  AppShell,
  Button,
  Container,
  Illustration,
  Select,
  StepProgress,
} from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import {
  type PopularRegionKeyword,
  RegionAreaSearch,
  type RegionGroup,
  type SituationRegionValue,
  useRegionStep,
} from "@/features/situation";
import styles from "./css/SituationRegionScreen.module.css";

export interface SituationRegionScreenProps {
  /** 메뉴 로그인 직전 호출(흐름 스냅샷 인계, issue #181). */
  onBeforeLogin?: () => void;
  groups: readonly RegionGroup[];
  popularKeywords: readonly PopularRegionKeyword[];
  /** 진행 표시용. 기본 2. */
  stepNumber?: number;
  /** 전체 스텝 수. 기본 4(시안). */
  totalSteps?: number;
  /** 이전에 선택한 지역 값(뒤로 왔을 때 복원). */
  value?: SituationRegionValue;
  /** CTA 버튼 문구. 기본 "다음". */
  nextLabel?: string;
  /** 상단 누적 요약 칩 바 슬롯. */
  summary?: ReactNode;
  onBack?: () => void;
  onNext?: (region: SituationRegionValue) => void;
}

/**
 * 상황입력 · 지역 스텝 화면 (widgets/situation).
 * date-planning 일러스트 스팟 + 구 드롭다운 + 동네 검색형 드롭다운(QA #2, issue #208) + 다음 CTA.
 */
export function SituationRegionScreen({
  groups,
  popularKeywords,
  stepNumber = 2,
  totalSteps = 4,
  value,
  nextLabel = "다음",
  summary,
  onBack,
  onBeforeLogin,
  onNext,
}: SituationRegionScreenProps) {
  const {
    selected,
    activeGroup,
    setActiveGroup,
    noGroupValue,
    groupOptions,
    query,
    setQuery,
    results,
    resultsCaption,
    resultsState,
    highlightQuery,
    popularKeywords: keywordChips,
    applyPopularKeyword,
    selectArea,
    isValid,
  } = useRegionStep(groups, popularKeywords, value);

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
            onClick={() => selected && onNext?.(selected)}
          >
            {nextLabel}
          </Button>
        </div>
      }
    >
      <StepProgress current={stepNumber} total={totalSteps} />

      {/*
        본문(main) 전체가 세로 스크롤된다(행정동 리스트가 길어도 접근 가능).
        CTA(footer)는 main 밖이라 스크롤과 무관하게 항상 고정된다.
        → "한 화면에 세로 스크롤 컨테이너 하나" 원칙: 내부 중첩 스크롤을 두지 않는다.
      */}
      <Container className={styles.content}>
        {summary}
        <Illustration name="date-planning" width={110} priority />
        <h1 className={`${styles.heading} text-display font-bold leading-snug text-text-strong`}>
          이번 데이트는
          <br />
          어디로 갈까요?
        </h1>

        <div className={styles.fields}>
          {/* ① 구 선택 (공용 드롭다운) */}
          <section className={styles.fieldBlock}>
            <p className={styles.stepLabel}>
              <span className={styles.stepBadge}>1</span>구 선택
            </p>
            <Select
              options={groupOptions}
              value={activeGroup ?? noGroupValue}
              onChange={(v) => setActiveGroup(v === noGroupValue ? undefined : v)}
              ariaLabel="구 선택"
            />
          </section>

          {/* ② 동네: 검색형 드롭다운 (QA #2, issue #208) */}
          <section className={styles.fieldBlock}>
            <p className={styles.stepLabel}>
              <span className={styles.stepBadge}>2</span>동네
            </p>
            <RegionAreaSearch
              query={query}
              onQueryChange={setQuery}
              caption={resultsCaption}
              popularKeywords={keywordChips}
              onPopularKeywordSelect={applyPopularKeyword}
              results={results}
              resultsState={resultsState}
              highlightQuery={highlightQuery}
              selectedId={selected?.districtId}
              selectedLabel={selected?.label}
              onSelect={selectArea}
            />
          </section>
        </div>
      </Container>
    </AppShell>
  );
}
