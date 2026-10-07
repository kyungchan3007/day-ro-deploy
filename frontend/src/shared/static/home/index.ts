/**
 * home 도메인 정적 콘텐츠 (SSR 렌더 대상).
 * 홈 진입 카드의 문구·링크. 일러스트 에셋은 위젯이 주입한다.
 */
export const homeStatic = {
  cards: {
    create: {
      title: "데이트 코스 짜러가기",
      subtitle: "새로운 코스를 생성할 수 있어요",
      href: "/course/new", // 상황입력 플로우 진입
    },
    saved: {
      title: "찜한 코스 보러가기",
      subtitle: "내가 만들었던 데이트 코스를\n확인할 수 있어요",
      href: "/saved", // 찜한 코스 목록
    },
  },
  footer: {
    // 홈 하단 정책 링크 + 저작권. 각 링크는 정적 라우트(SSG)로 연결된다.
    links: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "FAQ", href: "/faq" },
    ],
    copyright: "© 2026 Dayro. All rights reserved.",
  },
} as const;
