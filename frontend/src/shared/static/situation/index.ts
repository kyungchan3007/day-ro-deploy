/**
 * situation(상황 입력 · 코스 생성) 도메인 정적 문구.
 */
export const situationStatic = {
  /** 코스 생성 로딩 화면 상태 문구 (QA #22, issue #203). */
  loading: {
    pending: {
      title: "Dayro에서 데이트 코스를 만들고 있어요",
      description: "잠시만 기다려주세요!",
    },
    ready: {
      mark: "✅",
      title: "코스가 완성됐어요!",
      description: "아래 버튼을 눌러 코스를 확인해 보세요",
    },
  },
} as const;
