/**
 * course-map(확정 코스 · 저장) 도메인 정적 문구.
 */
export const courseMapStatic = {
  /** 코스 저장 결과 안내(issue #169 · #179). */
  saveMessages: {
    saved: "코스가 저장되었습니다.",
    loginRequired: "로그인 후 다시 저장해주세요.",
    failed: "코스를 저장하지 못했어요. 다시 시도해주세요.",
  },
  /** 장소 드롭다운 상세(QA #8, issue #219). */
  placeDetail: {
    hoursLabel: "영업시간",
    hoursEmpty: "영업시간 정보 없음",
    addressLabel: "주소",
    ratingLabel: "평점",
    photoEmpty: "사진 없음",
    photoAlt: (name: string) => `${name} 사진`,
  },
  /** 코스 저장 바텀시트(issue #229 static 이동). */
  saveSheet: {
    title: "코스 저장하기",
    nameLabel: "코스명",
    requiredHint: "(필수)",
    namePlaceholder: "예: 종로 데이트 코스",
    nameRequired: "코스명을 입력해주세요",
    descLabel: "한 줄 설명",
    descPlaceholder: "이 코스를 한 줄로 소개해보세요",
    submit: "저장하기",
    saving: "저장 중...",
    failed: "저장에 실패했습니다.",
  },
  /** 확정 코스 화면 하단 CTA · 안내(issue #229 static 이동). */
  screen: {
    saveCta: "코스 저장하기",
    routeGuideCta: "경로 안내 시작하기",
    routeGuideUnavailable: "길 안내를 시작할 장소가 부족해요.",
    saveFailedFallback: "코스 저장에 실패했습니다.",
  },
  /** 지도 상태 안내(issue #229 static 이동). */
  map: {
    loading: "지도를 불러오는 중…",
    error: "지도를 불러오지 못했어요.",
    empty: "표시할 위치 정보가 없어요.",
  },
  /** 장소 리스트 행 버튼 라벨(issue #229 static 이동). */
  placeList: {
    reorderLabel: (name: string) => `${name} 순서 변경`,
    collapse: "접기",
    expand: "상세보기",
  },
} as const;
