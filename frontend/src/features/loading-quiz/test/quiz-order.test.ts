import { describe, expect, it } from "vitest";

import { createQuizOrder, reshuffleQuizOrder, shuffle } from "../model/quiz-order";

// issue #229: 출제 순서 규칙을 훅에서 model 로 옮기고 random 주입으로 고정 검증한다.
/** 주어진 값을 차례로 돌려주는 random. */
function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("shuffle", () => {
  it("원본을 바꾸지 않고 같은 원소를 모두 담는다", () => {
    const source = [1, 2, 3, 4];
    const result = shuffle(source, Math.random);
    expect(source).toEqual([1, 2, 3, 4]);
    expect([...result].sort()).toEqual([1, 2, 3, 4]);
  });

  it("random 이 항상 0 이면 Fisher-Yates 로 한 칸씩 회전한다", () => {
    expect(shuffle(["a", "b", "c", "d"], () => 0)).toEqual(["b", "c", "d", "a"]);
  });

  it("random 이 1 에 가까우면 순서를 그대로 둔다", () => {
    expect(shuffle(["a", "b", "c"], () => 0.999)).toEqual(["a", "b", "c"]);
  });
});

describe("createQuizOrder", () => {
  it("문제 수만큼의 인덱스를 만든다", () => {
    expect(createQuizOrder(3, () => 0.999)).toEqual([0, 1, 2]);
    expect(createQuizOrder(0)).toEqual([]);
  });
});

describe("reshuffleQuizOrder", () => {
  it("직전 문제가 첫 문제로 오면 두 번째와 바꾼다", () => {
    expect(reshuffleQuizOrder(3, 0, () => 0.999)).toEqual([1, 0, 2]);
  });

  it("직전 문제가 첫 문제가 아니면 셔플 결과 그대로 둔다", () => {
    expect(reshuffleQuizOrder(3, 2, () => 0.999)).toEqual([0, 1, 2]);
  });

  it("문제가 하나뿐이면 반복을 피할 수 없으니 그대로 둔다", () => {
    expect(reshuffleQuizOrder(1, 0, () => 0.5)).toEqual([0]);
  });

  it("어떤 random 이어도 직전 문제가 곧바로 반복되지 않는다", () => {
    const random = sequence([0.1, 0.7, 0.3, 0.9, 0.5]);
    for (let finished = 0; finished < 4; finished += 1) {
      expect(reshuffleQuizOrder(4, finished, random)[0]).not.toBe(finished);
    }
  });
});
