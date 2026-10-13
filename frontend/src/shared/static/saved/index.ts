/**
 * saved(찜한 코스) 도메인의 정적 문구.
 * 실제 목록 데이터는 SSR 서버 준비 함수가 backend 저장 코스 API로 채운다.
 */
export const savedStatic = {
  navTitle: "찜한 코스",
  emptyText: "아직 저장한 코스가 없어요",
  empty: {
    title: "아직 저장한 코스가 없어요",
    desc: "마음에 드는 코스를 저장하고 여기서 다시 볼 수 있어요",
    ctaLabel: "코스 만들러 가기",
  },
  /** 공유 링크를 연 사람에게 보이는 이동 화면(issue #187). */
  shareRedirect: {
    movingTitle: "네이버 지도 길찾기로 이동하고 있어요",
    movingDesc: "자동으로 넘어가지 않으면 아래 버튼을 눌러주세요",
    openLabel: "네이버 지도에서 열기",
    invalidTitle: "공유 링크를 열 수 없어요",
    invalidDesc: "링크가 잘렸거나 올바르지 않아요. 공유한 분께 다시 받아주세요",
    homeLabel: "데이로 홈으로",
  },
};
