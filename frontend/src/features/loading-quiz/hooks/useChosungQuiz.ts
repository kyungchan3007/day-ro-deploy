"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

import {
  CHOSUNG_QUIZ_REVEAL_MS,
  isQuizLocked,
  shouldRevealAnswer,
} from "../model/attempt-policy";
import { toChoseong } from "../model/chosung";
import { getQuizFeedbackCopy, type ChosungQuizFeedbackCopy } from "../model/feedback-copy";
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
  /** 최근 제출 피드백(none/correct/wrong/revealed). */
  feedback: ChosungQuizFeedback;
  /** 오답 기회를 모두 써 공개한 정답. 공개 전이면 null. */
  revealedAnswer: string | null;
  /** 입력 · 제출 잠금(정답을 맞혔거나 공개된 문제). */
  locked: boolean;
  /** 현재 피드백 문구. */
  feedbackCopy: ChosungQuizFeedbackCopy;
  /** 정답 입력칸 ref. 문제가 바뀔 때 잃은 포커스를 되돌리는 데 쓴다. */
  inputRef: RefObject<HTMLInputElement | null>;
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
 * 오답 정책(issue #175): 오답 후 다시 입력 2회까지, 3번째 오답이면 정답을 공개하고 잠시 뒤 다음 문제.
 * UI(ChosungQuizCard)는 이 훅이 내려준 값/핸들러를 바인딩만 한다.
 * 포커스(issue #192): 정답 공개 · "다음 문제" 버튼으로 포커스가 사라진 채 문제가 바뀌면 입력칸으로 되돌린다.
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
  const [wrongCount, setWrongCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusOnNextQuestion = useRef(false);

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
    if (isQuizLocked(solved, feedback) || !currentItem) {
      return;
    }
    if (isCorrectAnswer(input, currentItem.answer)) {
      setSolved(true);
      setFeedback("correct");
      return;
    }
    const nextWrongCount = wrongCount + 1;
    setWrongCount(nextWrongCount);
    setFeedback(shouldRevealAnswer(nextWrongCount) ? "revealed" : "wrong");
  }, [solved, feedback, currentItem, input, wrongCount]);

  const onNext = useCallback(() => {
    const finishedIndex = order[cursor];
    restoreFocusOnNextQuestion.current = true;
    setInput("");
    setSolved(false);
    setFeedback("none");
    setWrongCount(0);

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

  // 정답을 공개했으면 잠시 보여준 뒤 다음 문제로 넘어간다.
  useEffect(() => {
    if (feedback !== "revealed") {
      return;
    }
    const timer = window.setTimeout(onNext, CHOSUNG_QUIZ_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [feedback, onNext]);

  // 문제가 바뀐 뒤 포커스가 사라졌으면(body) 입력칸으로 되돌린다. 다른 요소로 옮긴 포커스는 빼앗지 않는다.
  useEffect(() => {
    if (!restoreFocusOnNextQuestion.current) {
      return;
    }
    restoreFocusOnNextQuestion.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) {
      inputRef.current?.focus();
    }
  }, [order, cursor]);

  const revealedAnswer = feedback === "revealed" && currentItem ? currentItem.answer : null;

  return {
    visible: mounted && !dismissed,
    question: mounted && !dismissed ? question : null,
    input,
    solved,
    feedback,
    revealedAnswer,
    locked: isQuizLocked(solved, feedback),
    feedbackCopy: getQuizFeedbackCopy(feedback, revealedAnswer),
    inputRef,
    onInputChange,
    onSubmit,
    onNext,
    onSkip,
  };
}
