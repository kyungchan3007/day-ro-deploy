/**
 * 초성퀴즈 정답 판정 — 순수 로직.
 *
 * 정책: 앞뒤 공백만 무시하고 완전 일치할 때만 정답.
 * 가운데 띄어쓰기 차이나 오타는 오답으로 본다(요청 확정 사항).
 */

/** 입력값과 정답을 비교한다. 앞뒤 공백만 trim 후 완전 일치 여부. */
export function isCorrectAnswer(input: string, answer: string): boolean {
  const normalizedInput = input.trim();
  if (normalizedInput.length === 0) {
    return false;
  }
  return normalizedInput === answer.trim();
}
