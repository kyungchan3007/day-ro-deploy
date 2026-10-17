"use client";

import {
  SituationLoadingStatus,
  SituationSelectionTicker,
  useCourseReadyCue,
  type SituationAnswers,
} from "@/features/situation";
import { ChosungQuizCard, type UseChosungQuizResult } from "@/features/loading-quiz";
import { Button, Illustration, LoadingScreen } from "@/shared/ui";
import { cn } from "@/shared/ui/lib";
import { LOADING_CONTENT_MAX_WIDTH_CLASS } from "@/shared/config/loading-layout";
import { situationStatic } from "@/shared/static/situation";
import styles from "./css/SituationLoadingScreen.module.css";

/** 초성퀴즈 화면 상태. feature 공개 타입을 그대로 쓴다(issue #192). */
export type SituationLoadingQuizViewModel = UseChosungQuizResult;

/**
 * 로딩 일러스트 원래 폭(웹 · 이미지 요청 기준, issue #214).
 * 모바일(폭 640 미만) 축소 폭 120px 은 css/SituationLoadingScreen.module.css `.illustration` 이 맡는다(issue #229).
 */
const LOADING_ILLUSTRATION_WIDTH = 160;

export interface SituationLoadingScreenProps {
  answers?: SituationAnswers;
  /** 로딩 준비 완료 여부. CTA는 항상 노출하되 true일 때 활성화한다. */
  ready?: boolean;
  /** CTA 클릭 시 결과 화면으로 이동. */
  onViewCourse?: () => void;
  /** 초성퀴즈 화면 상태. */
  quiz?: SituationLoadingQuizViewModel;
}

/**
 * 상황입력 · 추천 생성 로딩 화면 (widgets/situation).
 * 기존 place-checklist 일러스트 · 선택 조건 티커 · 문구는 그대로 유지하고,
 * 대기 시간 동안 초성퀴즈 미니게임을 함께 보여준다.
 * 로딩이 끝나면 자동 이동 대신 "코스 보러 가기" CTA를 활성화한다(CTA는 처음부터 노출·공간 예약).
 * 안내 문구는 CTA 바로 위에서 생성 중 → 완료(✅)로 전환한다(QA #22, issue #203).
 * CTA 는 생성 중 반짝임, 완료 순간 팝 1회 · 짧은 진동으로 완료를 알린다(issue #203).
 * 모바일(폭 640 미만)만 한 화면에 들어오도록 일러스트 120 · 간격을 줄이고, 웹은 원래 크기(160)를 쓴다(issue #214).
 */
export function SituationLoadingScreen({
  answers,
  ready = false,
  onViewCourse,
  quiz,
}: SituationLoadingScreenProps) {
  const readyCue = useCourseReadyCue(ready);

  return (
    <LoadingScreen
      illustration={
        <Illustration
          name="place-checklist"
          width={LOADING_ILLUSTRATION_WIDTH}
          priority
          className={styles.illustration}
        />
      }
      middle={
        <div className="flex w-full flex-col items-center gap-3.5 sm:gap-5">
          {answers ? (
            <SituationSelectionTicker
              answers={answers}
              className={styles.ticker}
            />
          ) : null}

          {/* 생성 중 / 완료(✅) 안내는 CTA 바로 위에서 같은 자리로 전환한다(QA #22, issue #203). */}
          <SituationLoadingStatus ready={ready} />

          {/*
            CTA 는 처음부터 렌더해 공간을 예약하고, 준비 완료 전까지는 disabled 로 둔다.
            (완료 시점에 새로 삽입하면 아래 요소를 밀어내 layout shift(CLS)가 발생하므로,
            삽입이 아니라 활성화 상태 전이로 처리한다.)
          */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            className={cn(
              LOADING_CONTENT_MAX_WIDTH_CLASS,
              styles.cta,
              readyCue.pending && styles.ctaPending,
              readyCue.pop && styles.ctaPop,
            )}
            disabled={!ready}
            onClick={onViewCourse}
          >
            {situationStatic.loading.viewCourseLabel}
          </Button>

          {quiz?.visible && quiz.question && (
            <ChosungQuizCard
              question={quiz.question}
              input={quiz.input}
              solved={quiz.solved}
              feedback={quiz.feedback}
              locked={quiz.locked}
              feedbackCopy={quiz.feedbackCopy}
              inputRef={quiz.inputRef}
              onInputChange={quiz.onInputChange}
              onSubmit={quiz.onSubmit}
              onNext={quiz.onNext}
              onSkip={quiz.onSkip}
            />
          )}
        </div>
      }
    />
  );
}
