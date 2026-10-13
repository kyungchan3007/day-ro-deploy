/**
 * 초성퀴즈 오답 정책 (QA #17, issue #175).
 *
 * 기획 정책: 오답 후 다시 입력은 최대 2회까지 허용하고, 그 뒤(3번째 오답)에는
 * 정답을 자동으로 보여준 다음 잠시 후 다음 문제로 넘어간다.
 */

/** 오답 후 다시 입력할 수 있는 최대 횟수. */
export const CHOSUNG_QUIZ_MAX_RETRIES = 2;

/** 정답을 보여준 뒤 다음 문제로 넘어가기까지 시간. */
export const CHOSUNG_QUIZ_REVEAL_MS = 2000;

/**
 * 이번 오답으로 정답을 공개해야 하는지.
 * @param wrongCount 이번 오답을 포함한 현재 문제의 누적 오답 수.
 * @returns 다시 입력 기회를 모두 쓴 경우 true.
 */
export function shouldRevealAnswer(wrongCount: number): boolean {
  return wrongCount > CHOSUNG_QUIZ_MAX_RETRIES;
}
