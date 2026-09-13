"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { toChoseong } from "../model/chosung";
import { isCorrectAnswer } from "../model/judge";
import { CHOSUNG_QUIZ_ITEMS } from "../model/quiz-data";
import type {
  ChosungQuizFeedback,
  ChosungQuizItem,
  ChosungQuizQuestion,
} from "../model/types";

/** 하이드레이션 안전한 "마운트 여부" 스토어(구독 없음). */
const EMPTY_SUBSCRIBE = () => () => {};
const getMountedSnapshot = () => true;
const getMountedServerSnapshot = () => false;

/** Fisher-Yates 셔플(원본 불변). */
function shuffle<T>(source: readonly T[]): T[] {
  const next = [...source];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export interface UseChosungQuizResult {
  /** 마운트 후 & 미닫힘 상태에서만 true. false면 퀴즈를 렌더하지 않는다. */
  visible: boolean;
  /** 현재 문제(초성 파생 + 힌트). visible이 false면 null. */
  question: ChosungQuizQuestion | null;
  /** 정답 입력값. */
  input: string;
  /** 정답을 맞혀 다음 문제로 넘어갈 수 있는 상태인지. */
  solved: boolean;
  /** 최근 제출 피드백(none/correct/wrong). */
  feedback: ChosungQuizFeedback;
  /** 입력 변경. */
  onInputChange: (value: string) => void;
  /** 제출(정답 판정). */
  onSubmit: () => void;
  /** 다음 문제로. */
  onNext: () => void;
  /** 퀴즈 닫기(건너뛰기). */
  onSkip: () => void;
}

/**
 * 초성퀴즈 상태 기계 (features/loading-quiz).
 *
 * 책임: 현재 문제 선택 · 입력 · 정답/오답 판정 · 다음 문제 · 건너뛰기(닫기) · 무한 순환.
 * UI(ChosungQuizCard)는 이 훅이 내려준 값/핸들러를 바인딩만 한다.
 *
 * 순환 규칙: 문제 풀을 셔플해 순서대로 출제하고, 소진되면 다시 셔플한다
 * (직전 문제가 곧바로 반복되지 않도록 보정).
 * 하이드레이션 안전: 셔플·랜덤은 마운트 이후에만 노출한다(visible 게이트).
 *
 * @param items 문제 풀(기본: 앱 기본 초성 문제).
 */
export function useChosungQuiz(
  items: readonly ChosungQuizItem[] = CHOSUNG_QUIZ_ITEMS,
): UseChosungQuizResult {
  // 마운트 이후에만 퀴즈를 노출한다(셔플/랜덤 하이드레이션 불일치 방지).
  const mounted = useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    getMountedSnapshot,
    getMountedServerSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);
  const [order, setOrder] = useState<number[]>(() => shuffle(items.map((_, i) => i)));
  const [cursor, setCursor] = useState(0);
  const [input, setInput] = useState("");
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<ChosungQuizFeedback>("none");

  const currentItem = items.length > 0 ? items[order[cursor]] : undefined;

  const question = useMemo<ChosungQuizQuestion | null>(() => {
    if (!currentItem) {
      return null;
    }
    return { chosung: toChoseong(currentItem.answer), hint: currentItem.hint };
  }, [currentItem]);

  const onInputChange = useCallback((value: string) => {
    setInput(value);
    // 입력을 고치면 직전 오답 표시는 해제한다(정답 표시는 유지).
    setFeedback((prev) => (prev === "wrong" ? "none" : prev));
  }, []);

  const onSubmit = useCallback(() => {
    if (solved || !currentItem) {
      return;
    }
    if (isCorrectAnswer(input, currentItem.answer)) {
      setSolved(true);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }
  }, [solved, currentItem, input]);

  const onNext = useCallback(() => {
    const finishedIndex = order[cursor];
    setInput("");
    setSolved(false);
    setFeedback("none");

    const nextCursor = cursor + 1;
    if (nextCursor < order.length) {
      setCursor(nextCursor);
      return;
    }

    // 풀 소진 → 재셔플. 직전 문제가 첫 문제로 오면 한 번 밀어낸다.
    const reshuffled = shuffle(items.map((_, i) => i));
    if (reshuffled.length > 1 && reshuffled[0] === finishedIndex) {
      [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
    }
    setOrder(reshuffled);
    setCursor(0);
  }, [order, cursor, items]);

  const onSkip = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    visible: mounted && !dismissed,
    question: mounted && !dismissed ? question : null,
    input,
    solved,
    feedback,
    onInputChange,
    onSubmit,
    onNext,
    onSkip,
  };
}
