/**
 * home 도메인 정적 콘텐츠 (SSR 렌더 대상).
 * 홈 진입 카드의 문구·링크. 일러스트 에셋은 위젯이 주입한다.
 */
export const homeStatic = {
  cards: {
    create: {
      title: "데이트 코스 짜러가기",
      subtitle: "새로운 코스를 생성할 수 있어요",
      href: "#", // 라우트 확정 시 교체
    },
    saved: {
      title: "찜한 코스 보러가기",
      subtitle: "내가 만들었던 데이트 코스를\n확인할 수 있어요",
      href: "#", // 라우트 확정 시 교체
    },
  },
} as const;
