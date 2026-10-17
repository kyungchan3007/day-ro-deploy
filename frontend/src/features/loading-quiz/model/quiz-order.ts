/**
 * 초성퀴즈 출제 순서 규칙 (issue #229 — useChosungQuiz 에서 이동).
 * 문제 풀 인덱스를 셔플해 순서대로 출제하고, 소진되면 다시 셔플한다.
 * 테스트에서 순서를 고정할 수 있도록 random 함수를 주입받는다(기본 Math.random).
 */
export type QuizRandom = () => number;

/** Fisher-Yates 셔플(원본 불변). */
export function shuffle<T>(source: readonly T[], random: QuizRandom = Math.random): T[] {
  const next = [...source];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** 문제 풀 크기만큼의 인덱스를 셔플한 출제 순서. */
export function createQuizOrder(count: number, random: QuizRandom = Math.random): number[] {
  return shuffle(
    Array.from({ length: count }, (_, i) => i),
    random,
  );
}

/**
 * 풀 소진 후 재셔플한 출제 순서.
 * 직전 문제(finishedIndex)가 첫 문제로 오면 한 번 밀어내 곧바로 반복되지 않게 한다.
 */
export function reshuffleQuizOrder(
  count: number,
  finishedIndex: number | undefined,
  random: QuizRandom = Math.random,
): number[] {
  const reshuffled = createQuizOrder(count, random);
  if (reshuffled.length > 1 && reshuffled[0] === finishedIndex) {
    [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
  }
  return reshuffled;
}
