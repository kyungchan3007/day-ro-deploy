"use client";

import { useTransition } from "react";

import { Button } from "@/shared/ui/button";
import { SelectablePlaceCard } from "@/shared/ui/card";
import { CourseOrderStrip } from "@/shared/ui/course";
import { cn } from "@/shared/ui/lib";
import { RefreshIcon } from "@/shared/ui/icon";
import { AppShell, Container } from "@/shared/ui/layout";
import { Toast } from "@/shared/ui/toast";
import { AccountNavBar } from "@/features/auth";
import {
  useCourseResult,
  useCourseSelection,
} from "@/features/course-result";
import type { PlaceCandidate } from "@/features/situation";
import styles from "./css/CourseResultScreen.module.css";

export interface CourseResultScreenProps {
  /** 서버가 준비한 후보 목록. */
  candidates: PlaceCandidate[];
  /** 백엔드가 내려준 다른 코스 보기 잔여 횟수. 0이면 재요청을 막는다. */
  remainingRetries?: number;
  toastVisible?: boolean;
  toastMessage?: string | null;
  toastVariant?: "success" | "info" | null;
  /** CTA(선택완료) 이후 콜백. 선택 순서를 상위/다음 단계로 넘긴다. */
  onComplete?: (places: PlaceCandidate[]) => void;
  onReroll?: () => void;
  onBack?: () => void;
}

/**
 * 코스 추천 결과(장소 선택) 화면 (widgets/course-result).
 *
 * feature 훅(useCourseResult, useCourseSelection)이 준비한 후보/선택 상태를 받아
 * 결과 화면 레이아웃과 카드 목록을 조합한다.
 * 재요청 라우팅과 서버 재준비는 상위 flow/page 가 담당하고,
 * 이 위젯은 헤더/CTA/리스트/빈 상태 같은 화면 조합만 맡는다.
 *
 * 데이터는 실제 API 응답 기반이며 데모 하드코딩 장소는 쓰지 않는다.
 */
export function CourseResultScreen({
  candidates: initialCandidates,
  remainingRetries,
  toastVisible = false,
  toastMessage = null,
  toastVariant = null,
  onComplete,
  onReroll,
  onBack,
}: CourseResultScreenProps) {
  const [rerolling, startRerollTransition] = useTransition();
  const { selected, toggle, reset, orderOf, isValid, isFull, hint, max } =
    useCourseSelection();
  const { candidates, isEmpty } = useCourseResult({ candidates: initialCandidates });
  const rerollDisabled =
    rerolling || isEmpty || (remainingRetries != null && remainingRetries <= 0);

  /**
   * 다른 코스 보기: 서버가 현재 추천 세션(requestId)의 retry 계약으로 새 후보를 준비하도록
   * 라우트만 갱신한다. 남은 횟수가 0이면 서버 정책과 맞춰 버튼을 비활성화한다.
   */
  const handleReroll = () => {
    if (rerollDisabled) {
      return;
    }

    reset();
    startRerollTransition(() => {
      onReroll?.();
    });
  };

  /**
   * 선택 완료: 유효한 순서만 다음 단계 URL로 넘기고 라우트 전환은 상위가 맡는다.
   */
  const handleComplete = () => {
    if (!isValid) {
      return;
    }

    onComplete?.(selected);
  };

  return (
    <AppShell
      bleed
      nav={<AccountNavBar onBack={onBack} />}
      footer={
        <div className="border-t border-border px-4 py-3 sm:px-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid}
            onClick={handleComplete}
          >
            선택완료
          </Button>
        </div>
      }
      className="flex flex-col"
    >
      <Container
        className={cn("flex flex-1 flex-col pt-4 sm:pt-5", styles.screen)}
      >
        {/* 안내 문구 */}
        <p className="text-[13px] font-semibold text-primary">
          AI가 추천한 장소예요
        </p>
        <h1
          className={cn(
            "text-lg font-bold leading-snug text-text-strong sm:text-xl",
            styles.headerCopy,
          )}
        >
          탭해서 방문 순서를 정해보세요
        </h1>
        <p
          className={cn("text-[13px] text-text-muted sm:text-sm", styles.helperText)}
          aria-live="polite"
        >
          {hint}
        </p>

        {/* 다른 코스 보기 */}
        <div className={styles.rerollWrap}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReroll}
            disabled={rerollDisabled}
            aria-busy={rerolling}
            leftIcon={<RefreshIcon size={15} />}
          >
            {rerolling ? "다시 받는 중…" : "다른 코스 보기"}
          </Button>
          {remainingRetries != null && (
            <span className={styles.retryChip} aria-live="polite">
              남은 {remainingRetries}회
            </span>
          )}
        </div>

        {isEmpty ? (
          <EmptyResult onRetry={handleReroll} rerolling={rerolling} disabled={rerollDisabled} />
        ) : (
          <>
            {/* 선택 순서 스트립 */}
            <CourseOrderStrip
              className={styles.orderStrip}
              items={selected.map((p) => ({ id: p.placeId, name: p.name }))}
              max={max}
            />

            {/* 장소 카드 목록(실제 응답 데이터). 모바일에서도 한 화면에 들어오도록 간격과 카드 높이를 압축한다. */}
            <ul className={styles.cardGrid}>
              {candidates.map((place) => {
                const order = orderOf(place.placeId);
                const selectedNow = order != null;
                return (
                  <li key={place.placeId}>
                    <SelectablePlaceCard
                      name={place.name}
                      category={place.category}
                      region={place.district}
                      order={order}
                      rating={place.rating}
                      selected={selectedNow}
                      // 이미 선택된 카드는 최대치여도 비활성화하지 않는다(해제 가능).
                      disabled={isFull && !selectedNow}
                      onToggle={() => toggle(place)}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Container>
      {toastVisible && toastMessage && toastVariant && (
        <div className={styles.toastWrap}>
          <Toast message={toastMessage} variant={toastVariant} />
        </div>
      )}
    </AppShell>
  );
}

/** 후보가 없을 때의 안전한 빈 상태. */
function EmptyResult({
  onRetry,
  rerolling,
  disabled,
}: {
  onRetry: () => void;
  rerolling: boolean;
  disabled: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 text-center",
        styles.emptyState,
      )}
    >
      <p className="text-sm text-text-muted">
        추천된 장소가 없어요.
        <br />
        다시 추천을 받아볼까요?
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetry}
        disabled={disabled}
        aria-busy={rerolling}
        leftIcon={<RefreshIcon size={15} />}
      >
        {rerolling ? "다시 받는 중…" : "다시 추천받기"}
      </Button>
    </div>
  );
}
