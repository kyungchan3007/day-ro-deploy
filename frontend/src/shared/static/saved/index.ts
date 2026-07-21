/**
 * saved(찜한 코스) 도메인 정적 콘텐츠 (SSR 렌더 대상).
 * 목록은 로그인/저장 연동 전까지 placeholder. 실제 데이터는 추후 fetch.
 */
export interface SavedCourseItem {
  id: number;
  name: string;
  desc: string;
  /** "5곳 · 종로구" 형태. */
  meta: string;
  /** "2026.07.01 저장" 형태. */
  date: string;
}

export const savedStatic = {
  navTitle: "찜한 코스",
  emptyText: "아직 찜한 코스가 없어요", // placeholder 문구
  // 배열 타입으로 넓혀 빈 상태 분기를 유지(추후 실제 목록으로 교체)
  courses: [
    {
      id: 1,
      name: "종로 데이트 코스",
      desc: "고궁과 전통시장을 둘러보는 종로 한바퀴 코스",
      meta: "5곳 · 종로구",
      date: "2026.07.01 저장",
    },
    {
      id: 2,
      name: "홍대 나들이 코스",
      desc: "홍대 감성 골목을 즐기는 나들이 코스",
      meta: "4곳 · 마포구",
      date: "2026.06.20 저장",
    },
    {
      id: 3,
      name: "강남 소개팅 코스",
      desc: "세련된 강남에서 즐기는 소개팅 코스",
      meta: "4곳 · 강남구",
      date: "2026.06.15 저장",
    },
  ] as SavedCourseItem[],
};
