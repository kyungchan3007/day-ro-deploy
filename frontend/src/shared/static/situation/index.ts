/**
 * situation(상황 입력 · 코스 생성) 도메인 정적 문구.
 */
export const situationStatic = {
  /** 시간 스텝 데이트 시간 범위 안내 (issue #229). */
  time: {
    durationMeta: {
      belowMin: (minLabel: string) => `데이트 시간은 최소 ${minLabel} 이상으로 선택해 주세요.`,
      exceedsMax: (maxLabel: string) => `데이트 시간은 최대 ${maxLabel} 이내로 선택해 주세요.`,
      range: (minLabel: string, maxLabel: string) =>
        `${minLabel} ~ ${maxLabel} 사이로 선택할 수 있어요.`,
    },
  },
  /** 시간 스텝 장소 수 스테퍼 (QA #9 · issue #247, 시안 `dayro_prototype (13)`). */
  placeCount: {
    title: "몇 군데를 돌아볼까요?",
    description: "여유롭게, 혹은 알차게 정해보세요",
    label: "장소 수",
    unit: "곳",
    /** 값 앞에 붙여 읽는 말(화면에는 안 보임) → "장소 3곳". */
    valuePrefix: "장소",
    decreaseLabel: "줄이기",
    increaseLabel: "늘리기",
  },
  /** 지역 스텝 구 드롭다운 · 동네 검색형 드롭다운 문구 (QA #2 · issue #208, issue #229). */
  region: {
    /** 구 드롭다운 첫 옵션(전역 검색 모드). */
    noGroupLabel: "선택 안 함",
    search: {
      placeholder: "동네를 선택하거나 검색해보세요",
      ariaLabel: "동네 검색",
      collapseLabel: "동네 목록 접기",
      expandLabel: "동네 목록 펼치기",
      panelLabel: "동네 목록",
      popularLabel: "인기 검색어",
      listLabel: "동네 선택",
      /** 구를 고르지 않았고 검색어도 없음. 줄마다 <br /> 로 나눈다. */
      hintLines: ["구를 먼저 고르면 그 구의 동네 전체가 여기 보여요.", "바로 검색해도 돼요."],
      /** 검색했지만 결과 없음. 줄마다 <br /> 로 나눈다. */
      emptyLines: ["찾는 동네가 없어요.", "구를 다시 선택하거나 동네를 다시 입력해주세요."],
    },
    /** 드롭다운 목록 상단 캡션. */
    caption: {
      list: (groupLabel: string, count: number) => `${groupLabel} 동네 ${count}곳`,
      search: (count: number) => `검색 결과 ${count}곳`,
    },
  },
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
    /** 결과 화면 이동 CTA (issue #229). */
    viewCourseLabel: "코스 보러 가기",
  },
} as const;
