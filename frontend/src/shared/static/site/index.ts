/**
 * 사이트 공통 정적 콘텐츠 (SSR 렌더 대상).
 * 홈 · 시작 화면 하단 푸터의 정책 링크 + 저작권(issue #230 에서 home 에서 옮김).
 */
export const siteStatic = {
  footer: {
    // 각 링크는 정적 라우트(SSG)로 연결된다.
    links: [
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "FAQ", href: "/faq" },
    ],
    copyright: "© 2026 Dayro. All rights reserved.",
  },
} as const;
