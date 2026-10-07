/**
 * loading-quiz feature public API (client-safe).
 * 로딩 대기 중 초성퀴즈 미니게임 조각. 서버/BFF 의존 없음.
 * 외부(widgets/app)는 이 배럴로만 접근한다.
 */
export { ChosungQuizCard } from "./ui/ChosungQuizCard";
export type { ChosungQuizCardProps } from "./ui/ChosungQuizCard";
export { useChosungQuiz } from "./hooks/useChosungQuiz";
export type { UseChosungQuizResult } from "./hooks/useChosungQuiz";
export type {
  ChosungQuizItem,
  ChosungQuizQuestion,
  ChosungQuizFeedback,
} from "./model/types";
