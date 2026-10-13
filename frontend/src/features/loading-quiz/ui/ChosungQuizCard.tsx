"use client";

import { useId, type FormEvent } from "react";

import { Button, cn } from "@/shared/ui";

import type { ChosungQuizFeedback, ChosungQuizQuestion } from "../model/types";

export interface ChosungQuizCardProps {
  /** 현재 문제(초성 + 힌트). */
  question: ChosungQuizQuestion;
  /** 정답 입력값. */
  input: string;
  /** 정답을 맞힌 상태인지. */
  solved: boolean;
  /** 최근 제출 피드백. */
  feedback: ChosungQuizFeedback;
  /** 오답 기회를 모두 써 공개한 정답(issue #175). 공개 전이면 null. */
  revealedAnswer?: string | null;
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
  revealedAnswer = null,
  onInputChange,
  onSubmit,
  onNext,
  onSkip,
  className,
}: ChosungQuizCardProps) {
  // 정답을 맞혔거나 공개된 문제는 더 입력받지 않는다.
  const locked = solved || feedback === "revealed";
  const titleId = useId();
  const inputId = useId();
  const feedbackId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className={cn("flex w-full max-w-[320px] flex-col gap-3", className)}>
      <section
        aria-labelledby={titleId}
        className="flex flex-col items-center gap-3 rounded-3xl border border-primary/25 bg-primary-200 px-5 py-6 text-center"
      >
        <p id={titleId} className="text-sm font-bold text-primary">
          Q. 초성퀴즈
        </p>

        <p
          lang="ko"
          className="text-2xl font-extrabold tracking-[0.15em] text-text-strong"
        >
          {question.chosung}
        </p>

        <p className="text-xs text-text-muted">(힌트: {question.hint})</p>

        <form onSubmit={handleSubmit} className="mt-1 flex w-full flex-col gap-2.5">
          <label htmlFor={inputId} className="sr-only">
            초성퀴즈 정답 입력
          </label>
          <input
            id={inputId}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={locked}
            placeholder="정답을 입력해보세요"
            autoComplete="off"
            aria-describedby={feedback === "none" ? undefined : feedbackId}
            aria-invalid={feedback === "wrong"}
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-strong placeholder:text-text-disabled focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={locked}>
            제출
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
          {feedback === "correct" && "정답! 🎉"}
          {feedback === "wrong" && "오답입니다"}
          {feedback === "revealed" && revealedAnswer && (
            <>
              정답은 &lsquo;{revealedAnswer}&rsquo;이에요
              <span className="mt-0.5 block text-xs font-normal text-text-muted">
                곧 다음 문제로 넘어가요
              </span>
            </>
          )}
        </p>
      </section>

      <div className="flex justify-center gap-2">
        {solved && (
          <Button type="button" variant="tonal" size="md" onClick={onNext}>
            다음 문제
          </Button>
        )}
        <Button type="button" variant="secondary" size="md" onClick={onSkip}>
          건너뛰기
        </Button>
      </div>
    </div>
  );
}
