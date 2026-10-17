/**
 * loading-quiz(로딩 대기 초성퀴즈) 도메인 정적 문구.
 * 카드는 이 상수를 바인딩만 하고, 피드백 상태 → 문구 선택은 `features/loading-quiz/model` 이 맡는다.
 */
export const loadingQuizStatic = {
  title: "Q. 초성퀴즈",
  hintPrefix: "힌트",
  inputLabel: "초성퀴즈 정답 입력",
  inputPlaceholder: "정답을 입력해보세요",
  submitLabel: "제출",
  nextLabel: "다음 문제",
  skipLabel: "건너뛰기",
  feedback: {
    correct: "정답! 🎉",
    wrong: "오답입니다",
    /** 오답 기회를 모두 써 정답을 공개할 때(issue #175). */
    revealed: (answer: string) => `정답은 ‘${answer}’이에요`,
    revealedDetail: "곧 다음 문제로 넘어가요",
  },
};
