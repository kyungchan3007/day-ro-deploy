/**
 * course-result(코스 추천 결과 · 장소 선택) 도메인 정적 문구 (issue #229).
 */
export const courseResultStatic = {
  eyebrow: "AI가 추천한 장소예요",
  title: "탭해서 방문 순서를 정해보세요",
  completeLabel: "선택완료",
  /** 다른 코스 보기 · 다시 추천받기 버튼 진행 중 문구. */
  rerollingLabel: "다시 받는 중…",
  rerollLabel: "다른 코스 보기",
  /** 남은 횟수: `남은 {n}회` — 숫자만 강조 span 으로 감싼다. */
  retryCountPrefix: "남은 ",
  retryCountSuffix: "회",
  empty: {
    /** 줄마다 <br /> 로 나눈다. */
    lines: ["추천된 장소가 없어요.", "다시 추천을 받아볼까요?"],
    retryLabel: "다시 추천받기",
  },
} as const;
