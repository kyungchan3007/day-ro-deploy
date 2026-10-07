/** 초성퀴즈 문제 원본(정답만 관리, 초성은 파생). */
export interface ChosungQuizItem {
  /** 정답 단어. 초성은 이 값에서 자동 생성된다. */
  answer: string;
  /** 정답을 유추할 힌트 문구. */
  hint: string;
}

/** 화면에 표시할 문제 view-model(초성 파생 포함). */
export interface ChosungQuizQuestion {
  /** 자동 생성된 초성 문자열(예: `ㅁㅋㄹ`). */
  chosung: string;
  /** 힌트 문구. */
  hint: string;
}

/** 제출 결과 피드백 상태. */
export type ChosungQuizFeedback = "none" | "correct" | "wrong";
