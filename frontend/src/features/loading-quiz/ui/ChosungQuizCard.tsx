"use client";

import { useId, type FormEvent, type RefObject } from "react";

import { Button, cn } from "@/shared/ui";
import { loadingQuizStatic } from "@/shared/static/loading-quiz";

import type { ChosungQuizFeedbackCopy } from "../model/feedback-copy";
import type { ChosungQuizFeedback, ChosungQuizQuestion } from "../model/types";

export interface ChosungQuizCardProps {
  /** 현재 문제(초성 + 힌트). */
  question: ChosungQuizQuestion;
  /** 정답 입력값. */
  input: string;
  /** 정답을 맞힌 상태인지. */
  solved: boolean;
  /** 최근 제출 피드백(문구 색 · 접근성 상태용). */
  feedback: ChosungQuizFeedback;
  /** 입력 · 제출 잠금. 규칙은 `useChosungQuiz`(model `isQuizLocked`)가 정한다. */
  locked: boolean;
  /** 피드백 문구. 상태 → 문구 선택은 model `getQuizFeedbackCopy` 가 정한다. */
  feedbackCopy: ChosungQuizFeedbackCopy;
  /** 정답 입력칸 ref(문제 전환 시 포커스 복귀는 훅이 처리). */
  inputRef?: RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onSkip: () => void;
  className?: string;
}

/**
 * chosung-quiz-card : 로딩 대기 중 초성퀴즈 미니게임 카드(순수 UI).
 *
 * 상태/판정/순환은 `useChosungQuiz`가 소유하고, 이 컴포넌트는 값과 핸들러를
 * 마크업에 바인딩만 한다. 카드 박스 + 하단 컨트롤(다음 문제 / 건너뛰기)로 구성한다.
 */
export function ChosungQuizCard({
  question,
  input,
  solved,
  feedback,
  locked,
  feedbackCopy,
  inputRef,
  onInputChange,
  onSubmit,
  onNext,
  onSkip,
  className,
}: ChosungQuizCardProps) {
  const copy = loadingQuizStatic;
  const titleId = useId();
  const inputId = useId();
  const feedbackId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className={cn("flex w-full max-w-[320px] flex-col gap-2.5 sm:gap-3", className)}>
      <section
        aria-labelledby={titleId}
        className="flex flex-col items-center gap-2.5 rounded-3xl border border-primary/25 bg-primary-200 px-5 py-[18px] text-center sm:gap-3 sm:py-6"
      >
        <p id={titleId} className="text-sm font-bold text-primary">
          {copy.title}
        </p>

        <p
          lang="ko"
          className="text-2xl font-extrabold tracking-[0.15em] text-text-strong"
        >
          {question.chosung}
        </p>

        <p className="text-xs text-text-muted">
          ({copy.hintPrefix}: {question.hint})
        </p>

        <form onSubmit={handleSubmit} className="mt-0.5 flex w-full flex-col gap-2.5 sm:mt-1">
          <label htmlFor={inputId} className="sr-only">
            {copy.inputLabel}
          </label>
          {/* 글자 16px 미만이면 아이폰 사파리가 포커스 시 화면을 확대하고 그대로 둔다(issue #214). */}
          <input
            id={inputId}
            ref={inputRef}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={locked}
            placeholder={copy.inputPlaceholder}
            autoComplete="off"
            aria-describedby={feedback === "none" ? undefined : feedbackId}
            aria-invalid={feedback === "wrong"}
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base text-text-strong placeholder:text-text-disabled focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={locked}>
            {copy.submitLabel}
          </Button>
        </form>

        <p
          id={feedbackId}
          role="status"
          aria-live="polite"
          className={cn(
            "min-h-[1.25rem] text-sm font-semibold",
            feedback === "correct" && "text-success",
            feedback === "wrong" && "text-danger",
            feedback === "revealed" && "text-text-strong",
          )}
        >
          {feedbackCopy.message}
          {feedbackCopy.detail ? (
            <span className="mt-0.5 block text-xs font-normal text-text-muted">
              {feedbackCopy.detail}
            </span>
          ) : null}
        </p>
      </section>

      <div className="flex justify-center gap-2">
        {solved && (
          <Button type="button" variant="tonal" size="md" onClick={onNext}>
            {copy.nextLabel}
          </Button>
        )}
        <Button type="button" variant="secondary" size="md" onClick={onSkip}>
          {copy.skipLabel}
        </Button>
      </div>
    </div>
  );
}
