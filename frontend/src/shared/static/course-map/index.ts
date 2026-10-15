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
} as const;
