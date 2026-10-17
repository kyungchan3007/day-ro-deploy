import { loadingQuizStatic } from "@/shared/static/loading-quiz";

import type { ChosungQuizFeedback } from "./types";

export interface ChosungQuizFeedbackCopy {
  /** 피드백 본문. 보여줄 피드백이 없으면 null. */
  message: string | null;
  /** 본문 아래 보조 문구(정답 공개 시 "곧 다음 문제로…"). */
  detail: string | null;
}

/**
 * 피드백 상태 → 화면 문구 (issue #192).
 * 카드가 상태별 문구를 직접 고르지 않도록 선택 규칙을 model 에 둔다.
 */
export function getQuizFeedbackCopy(
  feedback: ChosungQuizFeedback,
  revealedAnswer: string | null,
): ChosungQuizFeedbackCopy {
  const copy = loadingQuizStatic.feedback;
  switch (feedback) {
    case "correct":
      return { message: copy.correct, detail: null };
    case "wrong":
      return { message: copy.wrong, detail: null };
    case "revealed":
      return revealedAnswer
        ? { message: copy.revealed(revealedAnswer), detail: copy.revealedDetail }
        : { message: null, detail: null };
    default:
      return { message: null, detail: null };
  }
}
