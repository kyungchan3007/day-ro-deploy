"use client";

import { SituationSelectionTicker, type SituationAnswers } from "@/features/situation";
import {
  ChosungQuizCard,
  type ChosungQuizFeedback,
  type ChosungQuizQuestion,
} from "@/features/loading-quiz";
import { Button, Illustration, LoadingScreen } from "@/shared/ui";
import styles from "./css/SituationLoadingScreen.module.css";

export interface SituationLoadingQuizViewModel {
  visible: boolean;
  question: ChosungQuizQuestion | null;
  input: string;
  solved: boolean;
  feedback: ChosungQuizFeedback;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onSkip: () => void;
}

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
 */
export function SituationLoadingScreen({
  answers,
  ready = false,
  onViewCourse,
  quiz,
}: SituationLoadingScreenProps) {
  return (
    <LoadingScreen
      illustration={
        <Illustration name="place-checklist" width={160} priority />
      }
      middle={
        <div className="flex w-full flex-col items-center gap-5">
          {answers ? (
            <SituationSelectionTicker
              answers={answers}
              className={styles.ticker}
            />
          ) : null}

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
            className="max-w-[320px]"
            disabled={!ready}
            onClick={onViewCourse}
          >
            코스 보러 가기
          </Button>

          {quiz?.visible && quiz.question && (
            <ChosungQuizCard
              question={quiz.question}
              input={quiz.input}
              solved={quiz.solved}
              feedback={quiz.feedback}
              onInputChange={quiz.onInputChange}
              onSubmit={quiz.onSubmit}
              onNext={quiz.onNext}
              onSkip={quiz.onSkip}
            />
          )}
        </div>
      }
      message="Dayro에서 데이트 코스를 만들고 있어요"
      subMessage="잠시만 기다려주세요!"
    />
  );
}
